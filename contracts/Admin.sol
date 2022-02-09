// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./AssetToken.sol";
import "./StakingToken.sol";

import "./adminBases/ShortStakingAdmin.sol";
import "./adminBases/LongStakingAdmin.sol";
import "./adminBases/ShortLockAdmin.sol";
import "./adminBases/AssetAdmin.sol";
import "./adminBases/MintAdmin.sol";
import "./adminBases/MasterChefAdmin.sol";

contract Admin is
    ShortStakingAdmin,
    LongStakingAdmin,
    ShortLockAdmin,
    AssetAdmin,
    MintAdmin,
    MasterChefAdmin
{
    struct AssetMember {
        address nToken;
        address sToken;
        address pair;
    }

    AssetMember[] public assetList;
    uint256 public assetCount;

    address public owner;

    // factory
    address public factory;

    // IAssetToken
    // IStakingToken

    constructor(
        address shortStaking_,
        address longStaking_,
        address shortLock_,
        address asset_,
        address mint_,
        address masterChef_,
        address factory_
    )
        ShortStakingAdmin(shortStaking_)
        LongStakingAdmin(longStaking_)
        ShortLockAdmin(shortLock_)
        AssetAdmin(asset_)
        MintAdmin(mint_)
        MasterChefAdmin(masterChef_)
    {
        factory = factory_;
        owner = msg.sender;
    }

    modifier onlyOwner()
        override(
            ShortStakingAdmin,
            LongStakingAdmin,
            ShortLockAdmin,
            AssetAdmin,
            MintAdmin,
            MasterChefAdmin
        ) {
        require(owner == msg.sender, "Admin: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Admin: new owner is the zero address");
        owner = newOwner;
    }

    function transferAllOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Admin: new owner is the zero address");
        IShortStaking_(shortStaking).transferOwnership(newOwner);
        ILongStaking_(longStaking).transferOwnership(newOwner);
        IShortLock_(shortLock).transferOwnership(newOwner);
        IAsset_(asset).transferOwnership(newOwner);
        IMint_(mint).transferOwnership(newOwner);
        IMasterChef_(masterChef).transferOwnership(newOwner);
    }

    struct WhiteListTokenParams {
        string nTokenName;
        string nTokenSymbol;
        string sTokenName;
        string sTokenSymbol;
    }

    struct WhiteListParams {
        AggregatorV3Interface oracle;
        uint16 auctionDiscount;
        uint16 minCRatio;
        uint16 targetRatio;
        bool isInPreIPO;
    }

    function whiteList(
        WhiteListTokenParams memory tokenParams,
        uint256 sAllocPoint_,
        uint256 lAllocPoint_,
        WhiteListParams memory whiteListParams,
        IPOParams memory ipoParams
    ) external onlyOwner {
        AssetToken nToken = new AssetToken(
            tokenParams.nTokenName,
            tokenParams.nTokenSymbol
        );
        nToken.transferOwnership(mint);

        StakingToken sToken = new StakingToken(
            tokenParams.sTokenName,
            tokenParams.sTokenSymbol
        );
        sToken.transferOwnership(shortStaking);

        address swapToToken = IMint_(mint).swapToToken();

        address pair = IUniswapV2Factory(factory).createPair(
            address(nToken),
            swapToToken
        );

        // add a long farm pool in MasterChef
        masterChef_add(lAllocPoint_, IERC20(pair), false);
        uint256 rootPoolId = IMasterChef(masterChef).poolLength() - 1;

        // add a pool in LongStaking
        longStaking_add(rootPoolId, false);

        // add a short farm pool in MasterChef
        masterChef_add(sAllocPoint_, IERC20(sToken), false);
        rootPoolId = IMasterChef(masterChef).poolLength() - 1;

        // add a pool in ShortStaking
        shortStaking_add(rootPoolId, address(sToken), false);
        uint256 poolId = IShortStaking(shortStaking).poolLength() - 1;

        // Register nAsset in Asset
        asset_registerAsset(
            address(nToken),
            address(whiteListParams.oracle),
            whiteListParams.auctionDiscount,
            whiteListParams.minCRatio,
            whiteListParams.targetRatio,
            whiteListParams.isInPreIPO,
            poolId,
            ipoParams
        );

        AssetMember memory member = AssetMember(
            address(nToken),
            address(sToken),
            pair
        );

        assetList.push(member);
        assetCount += 1;
    }

    function setFactory(address factory_) external onlyOwner {
        factory = factory_;
    }
}
