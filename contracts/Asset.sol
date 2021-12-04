// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IAsset.sol";

contract Asset is IAsset, Ownable {

    // Store registered n asset configuration information
    mapping(address => AssetConfig) private _assetsMap;

    // Store registered collateral asset configuration information
    mapping(address => CAssetConfig) private _cAssetsMap;

    // Determine whether the collateral is available in the PreIPO stage
    mapping(address => bool) private _isCollateralInPreIPO;

    /// @notice Triggered when register a new nAsset.
    /// @param assetToken nAsset token address
    event RegisterAsset(address assetToken);

    constructor() {

    }

    function asset(address nToken) external override view returns(AssetConfig memory) {
        return _assetsMap[nToken];
    }

    function cAsset(address token) external override view returns(CAssetConfig memory) {
        return _cAssetsMap[token];
    }

    /// @notice Register a new nAsset. Only owner
    /// @param assetToken nAsset token address
    /// @param assetOracle the oracle address of the nAsset
    /// @param auctionDiscount discount when liquidation
    /// @param minCRatio min c-ratio
    /// @param isInPreIPO is in PreIPO stage
    /// @param poolId The index of a pool in the ShortStaking contract.
    /// @param ipoParams PreIPO params
    function registerAsset(
        address assetToken, 
        address assetOracle, 
        uint16 auctionDiscount, 
        uint16 minCRatio, 
        uint16 targetRatio, 
        bool isInPreIPO, 
        uint poolId, 
        IPOParams memory ipoParams
    ) external onlyOwner {
        require(auctionDiscount > 0 && auctionDiscount < 1000, "Auction discount is out of range.");
        require(minCRatio >= 1000, "C-Ratio is out of range.");
        require(!_assetsMap[assetToken].assigned, "This asset has already been registered");

        if(isInPreIPO) {
            require(ipoParams.mintEnd > block.timestamp, "wrong mintEnd");
            require(ipoParams.preIPOPrice > 0, "The price in PreIPO couldn't be 0.");
            require(ipoParams.minCRatioAfterIPO > 0 && ipoParams.minCRatioAfterIPO < 1000, "C-Ratio(after IPO) is out of range.");
        }

        _assetsMap[assetToken] = AssetConfig(
            IAssetToken(assetToken), 
            AggregatorV3Interface(assetOracle), 
            auctionDiscount, 
            minCRatio, 
            targetRatio, 
            0, 
            8, 
            isInPreIPO, 
            ipoParams, 
            false, 
            poolId, 
            true
        );

        emit RegisterAsset(assetToken);
    }

    /// @notice update nAsset params. Only owner
    /// @param assetToken nAsset token address
    /// @param assetOracle oracle address
    /// @param auctionDiscount discount
    /// @param minCRatio min c-ratio
    /// @param isInPreIPO is in PreIPO stage
    /// @param ipoParams PreIPO params
    function updateAsset(
        address assetToken, 
        address assetOracle, 
        uint16 auctionDiscount, 
        uint16 minCRatio, 
        uint16 targetRatio, 
        bool isInPreIPO, 
        uint poolId, 
        IPOParams memory ipoParams
    ) external onlyOwner {
        require(auctionDiscount > 0 && auctionDiscount < 1000, "Auction discount is out of range.");
        require(minCRatio >= 1000, "C-Ratio is out of range.");
        require(_assetsMap[assetToken].assigned, "This asset are not registered yet.");

        if(isInPreIPO) {
            require(ipoParams.mintEnd > block.timestamp, "mintEnd in PreIPO needs to be greater than current time.");
            require(ipoParams.preIPOPrice > 0, "The price in PreIPO couldn't be 0.");
            require(ipoParams.minCRatioAfterIPO > 0 && ipoParams.minCRatioAfterIPO < 1000, "C-Ratio(after IPO) is out of range.");
        }

        _assetsMap[assetToken] = AssetConfig(
            IAssetToken(assetToken), 
            AggregatorV3Interface(assetOracle), 
            auctionDiscount, 
            minCRatio, 
            targetRatio, 
            0, 
            8, 
            isInPreIPO, 
            ipoParams, 
            false, 
            poolId, 
            true
        );
    }

    /// @notice Register a new clollateral. Only owner.
    /// @param cAssetToken Collateral Token address
    /// @param oracle oracle of collateral,if “0x0”, it's a stable coin
    /// @param multiplier collateral multiplier
    function registerCollateral(address cAssetToken, address oracle, uint16 multiplier) external onlyOwner {
        require(!_cAssetsMap[cAssetToken].assigned, "Collateral was already registered.");
        require(multiplier > 0, "A multiplier of collateral can not be 0.");
        _cAssetsMap[cAssetToken] = CAssetConfig(IERC20Extented(cAssetToken), AggregatorV3Interface(oracle), multiplier, true);
    }

    /// @notice update collateral info, Only owner.
    /// @param cAssetToken collateral Token address
    /// @param oracle collateral oracle
    /// @param multiplier collateral multiplier
    function updateCollateral(address cAssetToken, address oracle, uint16 multiplier) external onlyOwner {
        require(_cAssetsMap[cAssetToken].assigned, "Collateral are not registered yet.");
        require(multiplier > 0, "A multiplier of collateral can not be 0.");
        _cAssetsMap[cAssetToken] = CAssetConfig(IERC20Extented(cAssetToken), AggregatorV3Interface(oracle), multiplier, true);
    }

    /// @notice revoke a collateral, only owner
    /// @param cAssetToken collateral address
    function revokeCollateral(address cAssetToken) external onlyOwner {
        require(_cAssetsMap[cAssetToken].assigned, "Collateral are not registered yet.");
        delete _cAssetsMap[cAssetToken];
    }

    /// @notice When the time for an n-asset PreIPO phase has ended, this function can be called to trigger the IPO event, and Mint can continue after the IPO.
    /// @dev An n asset cannot perform any Mint operations after the PreIPO time ends and before the IPO event.
    /// @param assetToken nAsset token address
    function triggerIPO(address assetToken) external onlyOwner {
        AssetConfig memory assetConfig = _assetsMap[assetToken];
        require(assetConfig.assigned, "Asset was not registered yet.");
        require(assetConfig.isInPreIPO, "Asset is not in PreIPO.");
        
        require(assetConfig.ipoParams.mintEnd < block.timestamp);

        assetConfig.isInPreIPO = false;
        assetConfig.minCRatio = assetConfig.ipoParams.minCRatioAfterIPO;
        _assetsMap[assetToken] = assetConfig;
    }
    
    /// @notice Delisting an n asset will not continue Mint after delisting.
    /// @dev 1. Set the end price. 2. Set the minimum c-ratio to 100%.
    /// @param assetToken nAsset token address
    /// @param endPrice an end price after delist
    /// @param endPriceDecimals endPrice decimals
    function registerMigration(address assetToken, uint endPrice, uint8 endPriceDecimals) external onlyOwner {
        require(_assetsMap[assetToken].assigned, "Asset not registered yet.");
        _assetsMap[assetToken].endPrice = endPrice;
        _assetsMap[assetToken].endPriceDecimals = endPriceDecimals;
        _assetsMap[assetToken].minCRatio = 1000; // 1000 / 1000 = 1
        _assetsMap[assetToken].delisted = true;
    }

    /// @notice Set up collateral applicable to the PreIPO stage
    /// @param cAssetToken collateral token address
    /// @param value true or false
    function setCollateralInPreIPO(address cAssetToken, bool value) external onlyOwner {
        _isCollateralInPreIPO[cAssetToken] = value;
    }

    function isCollateralInPreIPO(address cAssetToken) external view override returns(bool) {
        return _isCollateralInPreIPO[cAssetToken];
    }

}