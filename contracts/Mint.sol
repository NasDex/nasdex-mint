// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "hardhat/console.sol";

import "./interface/IAsset.sol";
import "./interface/IAssetToken.sol";
import "./interface/IShortLock.sol";
import "./interface/IShortStaking.sol";
import "./interface/IPositions.sol";
import "./library/Swappable.sol";

/// @title Mint
/// @author Iwan
/// @notice The Mint Contract implements the logic for Collateralized Debt Positions (CDPs),
/// @notice through which users can mint or short new nAsset tokens against their deposited collateral. 
/// @dev The Mint Contract also contains the logic for liquidating CDPs with C-ratios below the 
/// @dev minimum for their minted mAsset through auction.
contract Mint is Ownable {
    
    using SafeERC20 for IERC20Extented;
    using SafeERC20 for IAssetToken;
    using SafeERC20 for IERC20;

    // Using the struct to avoid Stack too deep error
    struct VarsInFuncs{
        uint assetPrice;
        uint8 assetPriceDecimals;
        uint collateralPrice;
        uint8 collateralPriceDecimals;
    }

    struct VarsInAuction {
        uint returnedCollateralAmount;
        uint refundedAssetAmount;
        uint liquidatedAssetAmount;
        uint leftAssetAmount;
        uint leftCAssetAmount;
        uint protocolFee_;
    }

    /// @dev address(1) means native token, such as ETH or MATIC.
    // address constant private NATIVE_TOKEN = address(1);

    uint256 MAX_UINT256 = 2**256 - 1;

    /// @notice token address => total fee amount
    mapping(address => uint) public protocolFee;

    IAsset public asset;

    IPositions public positions;

    // 0 ~ 1000, fee = amount * feeRate / 1000.
    uint16 public feeRate;

    // Specify a token which will swap to it after
    // selling nAsset when people create a short position.
    address public swapToToken;

    /// @notice Short lock contract address.
    IShortLock public lock;

    /// @notice Short staking contract address.
    IShortStaking public staking;

    // oracle max delay.
    uint private _oracleMaxDelay;

    IUniswapV2Router swapRouter;
    address weth;

    /// @notice Triggered when deposit.
    /// @param positionId The index of this position.
    /// @param cAssetAmount collateral amount.
    event Deposit(uint positionId, uint cAssetAmount);

    /// @notice Triggered when withdraw.
    /// @param positionId The index of this position.
    /// @param cAssetAmount collateral amount.
    event Withdraw(uint positionId, uint cAssetAmount);

    /// @notice Triggered when mint.
    /// @param positionId The index of this position.
    /// @param assetAmount asset amount.
    event MintAsset(uint positionId, uint assetAmount);

    /// @notice Triggered when burn.
    /// @param positionId The index of this position.
    /// @param assetAmount asset amount.
    event Burn(uint positionId, uint assetAmount);

    /// @notice Triggered when auction.
    /// @param positionId The index of this position.
    /// @param assetAmount asset amount.
    event Auction(uint positionId, uint assetAmount);

    /// @notice Constructor 
    /// @param feeRate_ The percent of charging fee.
    /// @param swapRouter_ A router address of a swap like Uniswap.
    constructor(
        uint16 feeRate_, 
        address asset_,
        address positions_,
        address swapToToken_, 
        address lock_,
        address staking_,
        address swapRouter_, 
        address weth_
    ) {
        feeRate = feeRate_;
        asset = IAsset(asset_);
        swapToToken = swapToToken_;
        _oracleMaxDelay = 300;
        lock = IShortLock(lock_);
        positions = IPositions(positions_);
        staking = IShortStaking(staking_);
        swapRouter = IUniswapV2Router(swapRouter_);
        weth = weth_;

        IERC20Extented(swapToToken).safeApprove(address(lock), MAX_UINT256);
        IERC20Extented(swapToToken).safeApprove(address(swapRouter), MAX_UINT256);
    }

    function updateState(
        address asset_,
        address positions_,
        uint oracleMaxDelay_,
        address swapToToken_,
        uint16 feeRate_,
        address lock_,
        address staking_,
        address swapRouter_
    ) external onlyOwner {
        IERC20Extented(swapToToken).safeApprove(address(lock), 0);
        IERC20Extented(swapToToken).safeApprove(address(swapRouter), 0);
        asset = IAsset(asset_);
        positions = IPositions(positions_);
        require(feeRate_ >= 0 || feeRate_ <= 1000, "setFeeRate: value out of range.");
        feeRate = feeRate_;
        require(swapToToken_ != address(0), "setSwapToToken: can not point to zero address.");
        swapToToken = swapToToken_;
        _oracleMaxDelay = oracleMaxDelay_;
        lock = IShortLock(lock_);
        staking = IShortStaking(staking_);
        swapRouter = IUniswapV2Router(swapRouter_);
        IERC20Extented(swapToToken).safeApprove(address(lock), MAX_UINT256);
        IERC20Extented(swapToToken).safeApprove(address(swapRouter), MAX_UINT256);
    }

    /// @notice Open a new position by collateralizing assets. (Mint nAsset)
    /// @dev The C-Ratio users provided cannot less than the min C-Ratio in system.
    /// @param assetToken nAsset token address
    /// @param cAssetToken collateral token address
    /// @param cAssetAmount collateral amount
    /// @param cRatio collateral ratio
    function openPosition(
        IAssetToken assetToken, 
        IERC20Extented cAssetToken, 
        uint cAssetAmount, 
        uint16 cRatio
    ) public {
        _openPosition(assetToken, cAssetToken, cAssetAmount, cRatio, msg.sender, msg.sender, false);
    }

    /// @notice Open a short position, it will sell the nAsset immediately after mint.
    /// @notice 1.mint nAsset
    /// @notice 2.sell nAsset(swap to usdc)
    /// @notice 3.lock usdc by ShortLock contract
    /// @notice 4.mint sLP token and stake sLP to ShortStaking contract to earn reward
    /// @dev The C-Ratio users provided cannot less than the min C-Ratio in system.
    /// @param assetToken nAsset token address
    /// @param cAssetToken collateral token address
    /// @param cAssetAmount collateral amount
    /// @param cRatio collateral ratio
    /// @param swapAmountMin The minimum expected value during swap.
    /// @param swapDeadline When selling n assets, the deadline for the execution of this transaction
    function openShortPosition(
        IAssetToken assetToken, 
        IERC20Extented cAssetToken, 
        uint cAssetAmount, 
        uint16 cRatio,
        uint swapAmountMin,
        uint swapDeadline
    ) external {
        uint positionId;
        uint mintAmount;
        (positionId, mintAmount) = _openPosition(assetToken, cAssetToken, cAssetAmount, cRatio, msg.sender, address(this), true);

        if(assetToken.allowance(address(this), address(swapRouter)) < mintAmount) {
            assetToken.safeApprove(address(swapRouter), MAX_UINT256);
        }

        uint amountOut;
        if(swapToToken == address(1)) {
            amountOut = Swappable.swapExactTokensForETH(
                swapRouter, 
                weth, 
                mintAmount, 
                swapAmountMin, 
                address(assetToken), 
                address(this), 
                swapDeadline
            );
            amountOut = min(amountOut, address(this).balance);
        } else {
            amountOut = Swappable.swapExactTokensForTokens(
                swapRouter, 
                mintAmount, 
                swapAmountMin, 
                address(assetToken), 
                swapToToken, 
                address(this), 
                swapDeadline
            );
            amountOut = min(amountOut, IERC20(swapToToken).balanceOf(address(this)));
        }

        if(swapToToken == address(1)) {
            lock.lock{value:amountOut}(positionId, msg.sender, swapToToken, amountOut);
        } else {
            lock.lock(positionId, msg.sender, swapToToken, amountOut);
        }

        staking.deposit(asset.asset(address(assetToken)).poolId, mintAmount, msg.sender);
    }

    function _openPosition(
        IAssetToken assetToken, 
        IERC20Extented cAssetToken, 
        uint cAssetAmount, 
        uint16 cRatio, 
        address spender, 
        address receiver, 
        bool isShort
    ) private returns(uint positionId, uint mintAmount) {
        // AssetConfig memory assetConfig = asset.asset(address(assetToken));
        require(asset.asset(address(assetToken)).assigned && (!asset.asset(address(assetToken)).delisted), "Asset invalid");

        if(asset.asset(address(assetToken)).isInPreIPO) {
            require(asset.asset(address(assetToken)).ipoParams.mintEnd > block.timestamp);
            require(asset.isCollateralInPreIPO(address(cAssetToken)), "cAsset can not be collateral in PreIPO.");
        }

        // CAssetConfig memory cAssetConfig = asset.cAsset(address(cAssetToken));
        require(asset.cAsset(address(cAssetToken)).assigned, "Collateral not been listed yet.");
        //cRatio >= min_cRatio * multiplier
        require(asset.asset(address(assetToken)).minCRatio * asset.cAsset(address(cAssetToken)).multiplier <= cRatio, "C-Ratio should be greater than the min C-Ratio");

        VarsInFuncs memory v = VarsInFuncs(0, 0, 0, 0);

        (v.assetPrice, v.assetPriceDecimals) = _getPrice(asset.asset(address(assetToken)).token, false);
        (v.collateralPrice, v.collateralPriceDecimals) = _getPrice(asset.cAsset(address(cAssetToken)).token, true);

        // calculate mint amount.
        // uint collateralPriceInAsset = (collateralPrice / (10 ** collateralPriceDecimals)) / (assetPrice / (10 ** assetPriceDecimals));
        // uint mintAmount = (cAssetAmount / (10 ** cAssetToken.decimals())) * collateralPriceInAsset / (cRatio / 1000);
        // mintAmount = mintAmount * (10 ** assetToken.decimals());
        // To avoid calculation deviation caused by accuracy problems, the above three lines can be converted into the following two lines
        // uint mintAmount = cAssetAmount * collateralPrice * (10 ** assetPriceDecimals) * cRatio * (10 ** assetToken.decimals())
        //     / 1000 / (10 ** cAssetToken.decimals()) / (10 ** collateralPriceDecimals) / assetPrice;
        // To avoid stack depth issues, the above two lines can be converted to the following two lines
        uint a = cAssetAmount * v.collateralPrice * (10 ** v.assetPriceDecimals) * 1000 * (10 ** assetToken.decimals());
        mintAmount = a / cRatio / (10 ** cAssetToken.decimals()) / (10 ** v.collateralPriceDecimals) / v.assetPrice;
        require(mintAmount > 0, "mint amount cannot be 0");

        // transfer token
        cAssetToken.safeTransferFrom(spender, address(this), cAssetAmount);

        //create position
        positionId = positions.openPosition(spender, cAssetToken, cAssetAmount, assetToken, mintAmount, isShort);

        //mint token
        asset.asset(address(assetToken)).token.mint(receiver, mintAmount);
    }

    /// @notice Deposit collateral and increase C-Ratio
    /// @dev must approve first
    /// @param positionId position id
    /// @param cAssetAmount collateral amount
    function deposit(uint positionId, uint cAssetAmount) public {
        Position memory position = positions.getPosition(positionId);
        require(position.assigned, "There is no such a position, or it was removed.");
        require(position.owner == msg.sender, "You're not the position's owner.");
        require(cAssetAmount > 0, "Amount must cannot be 0.");
        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));
        require(cAssetConfig.assigned, "Collateral not been listed yet.");

        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        require(assetConfig.assigned, "Asset was not registered yet.");

        require(!assetConfig.delisted, "Asset has been delisted.");

        // transfer token
        position.cAssetToken.safeTransferFrom(msg.sender, address(this), cAssetAmount);

        // Increase collateral amount
        position.cAssetAmount += cAssetAmount;

        positions.updatePosition(position);

        emit Deposit(positionId, cAssetAmount);
    }

    /// @notice Withdraw collateral from a position
    /// @dev C-Ratio cannot less than min C-Ratio after withdraw
    /// @param positionId position id
    /// @param cAssetAmount collateral amount
    function withdraw(uint positionId, uint cAssetAmount) public {
        Position memory position = positions.getPosition(positionId);
        require(position.assigned, "There is no such a position, or it was removed.");
        require(position.owner == msg.sender, "You're not the position's owner.");
        require(cAssetAmount > 0, "Amount must cannot be 0.");
        require(position.cAssetAmount >= cAssetAmount, "Cannot withdraw more than you provide.");

        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));

        // get price
        uint assetPrice;
        uint8 assetPriceDecimals;
        (assetPrice, assetPriceDecimals) = _getPrice(assetConfig.token, false);
        uint collateralPrice;
        uint8 collateralPriceDecimals;
        (collateralPrice, collateralPriceDecimals) = _getPrice(cAssetConfig.token, true);

        // ignore multiplier for delisted assets
        uint16 multiplier = (assetConfig.delisted ? 1 : cAssetConfig.multiplier);

        uint remainingAmount = position.cAssetAmount - cAssetAmount;

        // Check minimum collateral ratio is satisfied
        // uint assetPriceInCollateral = (assetPrice / (10 ** assetPriceDecimals)) / (collateralPrice / (10 ** collateralPriceDecimals));
        // uint assetValueInCollateral = position.assetAmount / position.assetToken.decimals() * assetPriceInCollateral * position.cAssetToken.decimals();
        uint assetValueInCollateral = position.assetAmount * assetPrice * (10 ** collateralPriceDecimals) * position.cAssetToken.decimals() 
            / (10 ** assetPriceDecimals) / collateralPrice / position.assetToken.decimals();
        uint expectedAmount = assetValueInCollateral * assetConfig.minCRatio * multiplier / 1000;
        require(expectedAmount <= remainingAmount, "Cannot withdraw with an unsatisfied amount.");

        if(remainingAmount == 0 && position.assetAmount == 0) {
            positions.removePosition(positionId);
            // if it is a short position, release locked funds
            if(position.isShort) {
                lock.release(positionId);
            }
        } else {
            position.cAssetAmount = remainingAmount;
            positions.updatePosition(position);
        }

        // // charge a fee.
        // uint feeAmount = cAssetAmount * feeRate / 1000;
        // uint amountAfterFee = cAssetAmount - feeAmount;
        // protocolFee[address(position.cAssetToken)] += feeAmount;

        position.cAssetToken.safeTransfer(msg.sender, cAssetAmount);

        emit Withdraw(positionId, cAssetAmount);
    }

    /// @notice Mint more nAsset from an exist position.
    /// @dev C-Ratio cannot less than min C-Ratio after mint
    /// @param positionId position ID
    /// @param assetAmount nAsset amount
    /// @param swapAmountMin Min amount you wanna received when sold to a swap if this position is a short position.
    /// @param swapDeadline Deadline time when sold to swap.
    function mint(uint positionId, uint assetAmount, uint swapAmountMin, uint swapDeadline) public {
        Position memory position = positions.getPosition(positionId);
        require(position.assigned, "There is no such a position, or it was removed.");

        uint mintAmount = assetAmount;
        if(!position.isShort) {
            _mint(position, assetAmount, msg.sender);
            return;
        }

        _mint(position, assetAmount, address(this));

        uint amountOut;
        if(swapToToken == address(1)) {
            amountOut = Swappable.swapExactTokensForETH(
                swapRouter, 
                weth, 
                mintAmount, 
                swapAmountMin, 
                address(position.assetToken), 
                address(this), 
                swapDeadline
            );
            amountOut = min(amountOut, address(this).balance);
        } else {
            amountOut = Swappable.swapExactTokensForTokens(
                swapRouter, 
                mintAmount, 
                swapAmountMin, 
                address(position.assetToken), 
                swapToToken, 
                address(this), 
                swapDeadline
            );
            uint bal = IERC20(swapToToken).balanceOf(address(this));
            amountOut = min(amountOut, bal);
        }

        if(swapToToken == address(1)) {
            lock.lock{value:amountOut}(positionId, msg.sender, swapToToken, amountOut);
        } else {
            lock.lock(positionId, msg.sender, swapToToken, amountOut);
        }

        staking.deposit(asset.asset(address(position.assetToken)).poolId, mintAmount, msg.sender);
    }

    function _mint(Position memory position, uint assetAmount, address receiver) private {
        
        require(position.owner == msg.sender, "You're not the position's owner.");
        require(assetAmount > 0, "Amount must cannot be 0.");

        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        require(assetConfig.assigned, "Asset was not registered yet.");

        require(!assetConfig.delisted, "Asset has been delisted.");

        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));
        require(cAssetConfig.assigned, "Collateral not been listed yet, or be removed.");

        if(assetConfig.isInPreIPO) {
            require(assetConfig.ipoParams.mintEnd > block.timestamp);
        }

        // get price
        uint assetPrice;
        uint8 assetPriceDecimals;
        (assetPrice, assetPriceDecimals) = _getPrice(assetConfig.token, false);
        uint collateralPrice;
        uint8 collateralPriceDecimals;
        (collateralPrice, collateralPriceDecimals) = _getPrice(cAssetConfig.token, true);

        uint16 multiplier = cAssetConfig.multiplier;
        // Compute new asset amount
        uint mintedAmount = position.assetAmount + assetAmount;

        // Check minimum collateral ratio is satisfied
        // uint assetPriceInCollateral = (assetPrice / (10 ** assetPriceDecimals)) / (collateralPrice / (10 ** collateralPriceDecimals));
        // uint assetValueInCollateral = mintedAmount / position.assetToken.decimals() * assetPriceInCollateral * position.cAssetToken.decimals();
        uint assetValueInCollateral = mintedAmount * assetPrice * (10 ** collateralPriceDecimals) * position.cAssetToken.decimals() 
            / (10 ** assetPriceDecimals) / collateralPrice / position.assetToken.decimals();
        uint expectedAmount = assetValueInCollateral * assetConfig.minCRatio * multiplier / 1000;
        require(expectedAmount <= position.cAssetAmount, "Cannot mint with an unsatisfied amount.");

        position.assetAmount = mintedAmount;
        positions.updatePosition(position);

        position.assetToken.mint(receiver, assetAmount);

        emit MintAsset(position.id, assetAmount);
    }

    /// @notice Burn nAsset and increase C-Ratio
    /// @dev The position will be closed if all of the nAsset has been burned.
    /// @param positionId position id
    /// @param assetAmount nAsset amount to be burned
    function burn(uint positionId, uint assetAmount) public {
        Position memory position = positions.getPosition(positionId);
        require(position.assigned, "There is no such a position, or it was removed.");
        require((assetAmount > 0) && (assetAmount <= position.assetAmount), "Wrong burn amount");

        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        require(assetConfig.assigned, "Asset was not registered yet.");

        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));

        if(assetConfig.isInPreIPO) {
            require(assetConfig.ipoParams.mintEnd > block.timestamp);
        }

        VarsInFuncs memory v = VarsInFuncs(0, 0, 0, 0);

        // uint collateralPrice;
        // uint8 collateralPriceDecimals;
        (v.collateralPrice, v.collateralPriceDecimals) = _getPrice(cAssetConfig.token, true);

        bool closePosition = false;
        // uint assetPrice;
        // uint8 assetPriceDecimals;
        uint cAssetAmount;
        uint protocolFee_;

        if(assetConfig.delisted) {
            v.assetPrice = assetConfig.endPrice;
            v.assetPriceDecimals = assetConfig.endPriceDecimals;
            // uint assetPriceInCollateral = (assetPrice / (10 ** assetPriceDecimals)) / (collateralPrice / (10 ** collateralPriceDecimals));
            // uint conversionRate = position.cAssetAmount / position.assetAmount;
            // uint amount1 = assetAmount / assetConfig.token.decimals() * assetPriceInCollateral * cAssetConfig.token.decimals();
            // uint amount2 = assetAmount * conversionRate;

            uint a = assetAmount * cAssetConfig.token.decimals() * v.assetPrice * (10 ** v.collateralPriceDecimals);
            uint amount1 = a / (10 ** v.assetPriceDecimals) / v.collateralPrice / assetConfig.token.decimals();
            uint amount2 = assetAmount * position.cAssetAmount / position.assetAmount;
            cAssetAmount = min(amount1, amount2);

            position.assetAmount -= assetAmount;
            position.cAssetAmount -= cAssetAmount;

            // due to rounding, include 1
            if(position.cAssetAmount <= 1 && position.assetAmount == 0) {
                closePosition = true;
                positions.removePosition(positionId);
            } else {
                positions.updatePosition(position);
            }

            protocolFee_ = cAssetAmount * feeRate / 1000;
            protocolFee[address(position.cAssetToken)] += protocolFee_;
            cAssetAmount = cAssetAmount - protocolFee_;
            
            position.cAssetToken.safeTransfer(msg.sender, cAssetAmount);
            position.assetToken.burnFrom(msg.sender, assetAmount);
        } else {
            require(msg.sender == position.owner, "You don't own this position.");
            
            (v.assetPrice, v.assetPriceDecimals) = _getPrice(assetConfig.token, false);
            cAssetAmount = assetAmount * cAssetConfig.token.decimals() * v.assetPrice * (10 ** v.collateralPriceDecimals) / (10 ** v.assetPriceDecimals) / v.collateralPrice / assetConfig.token.decimals();
            protocolFee_ = cAssetAmount * feeRate / 1000;
            protocolFee[address(position.cAssetToken)] += protocolFee_;

            position.assetAmount -= assetAmount;
            position.cAssetAmount -= protocolFee_;

            if(position.assetAmount == 0) {
                closePosition = true;
                positions.removePosition(positionId);
                position.cAssetToken.safeTransfer(msg.sender, position.cAssetAmount);
            } else {
                positions.updatePosition(position);
            }
            
            position.assetToken.burnFrom(msg.sender, assetAmount);

            emit Burn(positionId, assetAmount);
        }

        if(position.isShort) {
            staking.withdraw(assetConfig.poolId, assetAmount, msg.sender);
            if(closePosition) {
                lock.release(positionId);
            }
        }
    }

    /// @notice The position can be liquidited if the C-Ratio is less than the min C-Ratio.
    /// @notice During the liquidating, system will sell the collateral at a discounted price.
    /// @notice Everyone can buy it.
    /// @param positionId position id
    /// @param assetAmount nAsset amount
    function auction(uint positionId, uint assetAmount) public {
        Position memory position = positions.getPosition(positionId);
        require(position.assigned, "There is no such a position, or it was removed.");
        require((assetAmount > 0) && assetAmount <= position.assetAmount, "Amount must be greater than 0 and less than the amount in position.");

        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        require(!assetConfig.delisted, "Asset was already delisted.");

        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));

        VarsInFuncs memory v = VarsInFuncs(0, 0, 0, 0);

        (v.assetPrice, v.assetPriceDecimals) = _getPrice(assetConfig.token, false);
        (v.collateralPrice, v.collateralPriceDecimals) = _getPrice(cAssetConfig.token, true);

        require(_checkPositionInAuction(position, v), "Cannot liquidate a safely collateralized position");

        uint maxAssetAmount = _amountInAuction(assetConfig, cAssetConfig, position, v);

        VarsInAuction memory va = VarsInAuction(0, 0, 0, 0, 0, 0);
        va.liquidatedAssetAmount = min(assetAmount, maxAssetAmount);
        va.returnedCollateralAmount = _cAmountInAuction(assetConfig, v, va.liquidatedAssetAmount);

        va.leftAssetAmount = position.assetAmount - va.liquidatedAssetAmount;
        va.leftCAssetAmount = position.cAssetAmount - va.returnedCollateralAmount;

        bool closedPosition = false;

        if(va.leftCAssetAmount == 0) {
            closedPosition = true;
            positions.removePosition(positionId);
        } else if(va.leftAssetAmount == 0) {
            closedPosition = true;
            positions.removePosition(positionId);
            // refunds left collaterals to position owner
            position.cAssetToken.safeTransfer(position.owner, va.leftCAssetAmount);
        } else {
            position.cAssetAmount = va.leftCAssetAmount;
            position.assetAmount = va.leftAssetAmount;
            positions.updatePosition(position);
        }

        position.assetToken.burnFrom(msg.sender, va.liquidatedAssetAmount);

        // uint assetPriceInCollateral = (v.assetPrice / (10 ** v.assetPriceDecimals)) / (v.collateralPrice / (10 ** v.collateralPriceDecimals));
        // uint protocolFee_ = liquidatedAssetAmount * assetPriceInCollateral * feeRate / 1000;
        va.protocolFee_ = va.liquidatedAssetAmount * v.assetPrice * (10 ** v.collateralPriceDecimals) / (10 ** v.assetPriceDecimals) / v.collateralPrice * feeRate / 1000;
        protocolFee[address(position.cAssetToken)] += va.protocolFee_;

        va.returnedCollateralAmount = va.returnedCollateralAmount - va.protocolFee_;
        position.cAssetToken.safeTransfer(msg.sender, va.returnedCollateralAmount);

        emit Auction(positionId, assetAmount);

        if(position.isShort) {
            staking.withdraw(assetConfig.poolId, assetAmount, msg.sender);
            if(closedPosition) {
                lock.release(positionId);
            }
        }
    }

    /// @notice View function, can shows the max nAsset amount and collateral amount in an auction.
    /// @param positionId Index of a position.
    /// @return 1.max nAsset amount(can be burned)
    /// @return 2.max collateral amount(in auction)
    function amountInAuction(uint positionId) external view returns(uint, uint) {
        Position memory position = positions.getPosition(positionId);
        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));

        if((!position.assigned) || assetConfig.delisted) {
            return (0, 0);
        }
        
        VarsInFuncs memory v = VarsInFuncs(0, 0, 0, 0);

        (v.assetPrice, v.assetPriceDecimals) = _getPrice(assetConfig.token, false);
        (v.collateralPrice, v.collateralPriceDecimals) = _getPrice(cAssetConfig.token, true);
        
        if(_checkPositionInAuction(position, v) == false) {
            return (0, 0);
        }
        
        uint maxAssetAmount = _amountInAuction(assetConfig, cAssetConfig, position, v);
        
        uint returnedCAssetAmount = _cAmountInAuction(assetConfig, v, maxAssetAmount);
        
        return (maxAssetAmount, returnedCAssetAmount);
    }

    function _amountInAuction(
        AssetConfig memory assetConfig, 
        CAssetConfig memory cAssetConfig, 
        Position memory position, 
        VarsInFuncs memory v
    ) private view returns(uint maxAssetAmount) {

        uint aDecimalDivisor = 10 ** assetConfig.token.decimals();
        uint cDecimalDivisor = 10 ** cAssetConfig.token.decimals();
        uint aPriceDecimalDivisor = 10 ** v.assetPriceDecimals;
        uint cPriceDecimalDivisor = 10 ** v.collateralPriceDecimals;

        // uint collateralInUsd = (position.cAssetAmount / cDecimalDivisor) * (v.collateralPrice / cPriceDecimalDivisor);
        // uint collateralInUsd = position.cAssetAmount * v.collateralPrice / (cDecimalDivisor * cPriceDecimalDivisor);
        // uint assetInUsd = (position.assetAmount / aDecimalDivisor) * (v.assetPrice / aPriceDecimalDivisor);
        // uint assetInUsd = position.assetAmount * v.assetPrice / (aDecimalDivisor * aPriceDecimalDivisor);
        // uint curRatio = collateralInUsd / assetInUsd * 100000;
        
        uint curRatio = 
            position.cAssetAmount * v.collateralPrice 
            * aDecimalDivisor * aPriceDecimalDivisor 
            * 100000 
            / cDecimalDivisor / cPriceDecimalDivisor 
            / position.assetAmount / v.assetPrice;
        
        uint discountRatio = 1000 * 100000 / assetConfig.auctionDiscount;
        
        // console.log("---curRatio: %d", curRatio);
        // console.log("---discountRatio: %d", discountRatio);
        if(curRatio > discountRatio) {

            // Aa' = ((Aa * Pa * R'') - (Ac * Pc)) / (Pa * R'' - (Pa / D))
            // a = (Aa * Pa * R'')
            // b = (Ac * Pc)
            // c = Pa * R''
            // d = Pa / D
            // d = Pa / (aD / 1000)
            // d = Pa * 1000 / aD
            // Aa' = (a - b) / (c - d)
            // Aa' = ((a - b) * 10000) / ((c - d) * 10000)
            uint a = position.assetAmount * v.assetPrice * assetConfig.targetRatio * 10000 / 1000 / aPriceDecimalDivisor / aDecimalDivisor;
            uint b = position.cAssetAmount * 10000 * v.collateralPrice / cPriceDecimalDivisor / cDecimalDivisor;
            uint c = v.assetPrice * assetConfig.targetRatio * 10000 / 1000 / cPriceDecimalDivisor;
            uint d = v.assetPrice * 1000 * 10000 / aPriceDecimalDivisor / assetConfig.auctionDiscount;
            maxAssetAmount = (a - b) * aDecimalDivisor / (c - d);
        } else {
            maxAssetAmount = position.cAssetAmount * aPriceDecimalDivisor * v.collateralPrice * assetConfig.auctionDiscount / (v.assetPrice * cPriceDecimalDivisor * 1000);
        }
    }

    function _cAmountInAuction(
        AssetConfig memory assetConfig, 
        VarsInFuncs memory v, 
        uint assetAmount
    ) private pure returns(uint returnedCAssetAmount) {
        // uint assetPriceInCollateral = (v.assetPrice / (10 ** v.assetPriceDecimals)) / (v.collateralPrice / (10 ** v.collateralPriceDecimals));
        // uint discountedPrice = assetPriceInCollateral / (assetConfig.auctionDiscount / 1000);
        // uint discountedValue = assetAmount * discountedPrice;
        // uint discountedPrice = v.assetPrice * (10 ** v.collateralPriceDecimals) * 1000 / (10 ** v.assetPriceDecimals) / v.collateralPrice / assetConfig.auctionDiscount;
        // uint discountedValue = assetAmount * v.assetPrice * (10 ** v.collateralPriceDecimals) * 1000 / (10 ** v.assetPriceDecimals) / v.collateralPrice / assetConfig.auctionDiscount;
        uint c = assetAmount * v.assetPrice * (10 ** v.collateralPriceDecimals) * 1000;
        returnedCAssetAmount = c / (10 ** v.assetPriceDecimals) / v.collateralPrice / assetConfig.auctionDiscount;
    }

    /// @notice Query whether a certain position is in liquidation status
    /// @param positionId position id
    /// @return bool - is in liquidation status
    function isInAuction(uint positionId) external view returns(bool) {
        VarsInFuncs memory v = VarsInFuncs(0, 0, 0, 0);
        Position memory position = positions.getPosition(positionId);
        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));

        if (!position.assigned) {
            return false;
        }

        (v.assetPrice, v.assetPriceDecimals) = _getPrice(assetConfig.token, false);
        (v.collateralPrice, v.collateralPriceDecimals) = _getPrice(cAssetConfig.token, true);

        return _checkPositionInAuction(position, v);
    }

    function _getPrice(IERC20Extented token, bool isCollateral) private view returns(uint, uint8) {
        AggregatorV3Interface oracle;
        if(isCollateral) {
            require(asset.cAsset(address(token)).assigned, "Collateral not been listed yet, or be removed.");
            if(address(asset.cAsset(address(token)).oracle) == address(0x0)) {
                // Stablecoin
                return (uint(100000000), uint8(8));
            }
            if(asset.asset(address(token)).assigned && asset.asset(address(token)).delisted) {
                // It is collateral and nAssets, and it has been delisted
                return (asset.asset(address(token)).endPrice, asset.asset(address(token)).endPriceDecimals);
            }
            oracle = asset.cAsset(address(token)).oracle;
        } else {
            require(asset.asset(address(token)).assigned, "Asset was not registered yet.");
            if(asset.asset(address(token)).delisted) {
                // delisted nAsset
                return (asset.asset(address(token)).endPrice, asset.asset(address(token)).endPriceDecimals);
            }
            oracle = asset.asset(address(token)).oracle;
        }
        
        (
            , 
            int price,
            uint startedAt,
            ,
        ) = oracle.latestRoundData();

        require((block.timestamp - startedAt) < _oracleMaxDelay, "Price expired.");
        require(price >= 0, "Price is incorrect.");

        uint8 decimals = oracle.decimals();

        return (uint(price), decimals);
    }

    function _checkPositionInAuction(Position memory position, VarsInFuncs memory v) private view returns(bool) {
        CAssetConfig memory cAssetConfig = asset.cAsset(address(position.cAssetToken));
        AssetConfig memory assetConfig = asset.asset(address(position.assetToken));
        // uint assetPriceInCollateral = (v.assetPrice / (10 ** v.assetPriceDecimals)) / (v.collateralPrice / (10 ** v.collateralPriceDecimals));
        // uint assetValueInCollateral = position.assetAmount / position.assetToken.decimals() * assetPriceInCollateral * position.cAssetToken.decimals();
        uint assetValueInCollateral = position.assetAmount * v.assetPrice * (10 ** v.collateralPriceDecimals) * position.cAssetToken.decimals() 
            / (10 ** v.assetPriceDecimals) / v.collateralPrice / position.assetToken.decimals();
        
        uint expectedAmount = assetValueInCollateral * assetConfig.minCRatio / 1000 * cAssetConfig.multiplier;
        
        return (expectedAmount >= position.cAssetAmount);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}