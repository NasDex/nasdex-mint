// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IOwnable.sol";
import "../../interface/IAsset.sol";

interface IAsset_ is IAsset, IOwnable {
    function registerAsset(
        address assetToken,
        address assetOracle,
        uint16 auctionDiscount,
        uint16 minCRatio,
        uint16 targetRatio,
        bool isInPreIPO,
        uint256 poolId,
        IPOParams memory ipoParams
    ) external;

    function updateAsset(
        address assetToken,
        address assetOracle,
        uint16 auctionDiscount,
        uint16 minCRatio,
        uint16 targetRatio,
        bool isInPreIPO,
        uint256 poolId,
        IPOParams memory ipoParams
    ) external;

    function registerCollateral(
        address cAssetToken,
        address oracle,
        uint16 multiplier
    ) external;

    function updateCollateral(
        address cAssetToken,
        address oracle,
        uint16 multiplier
    ) external;

    function revokeCollateral(address cAssetToken) external;

    function triggerIPO(address assetToken) external;

    function registerMigration(
        address assetToken,
        uint256 endPrice,
        uint8 endPriceDecimals
    ) external;

    function setCollateralInPreIPO(address cAssetToken, bool value) external;
}
