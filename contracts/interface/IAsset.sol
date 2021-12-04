// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IAssetToken.sol";

struct IPOParams{
    uint mintEnd;
    uint preIPOPrice;
    // >= 1000
    uint16 minCRatioAfterIPO;
}

struct AssetConfig {
    IAssetToken token;
    AggregatorV3Interface oracle;
    uint16 auctionDiscount;
    uint16 minCRatio;
    uint16 targetRatio;
    uint endPrice;
    uint8 endPriceDecimals;
    // 是否在PreIPO阶段
    bool isInPreIPO;
    IPOParams ipoParams;
    // 是否已退市
    bool delisted;
    // the Id of the pool in ShortStaking contract.
    uint poolId;
    // 判断该空间是否已被分配
    bool assigned;
}

// Collateral Asset Config
struct CAssetConfig {
    IERC20Extented token;
    AggregatorV3Interface oracle;
    uint16 multiplier;
    // 判断该空间是否已被分配
    bool assigned;
}

interface IAsset {
    function asset(address nToken) external view returns(AssetConfig memory);
    function cAsset(address token) external view returns(CAssetConfig memory);
    function isCollateralInPreIPO(address cAssetToken) external view returns(bool);
}