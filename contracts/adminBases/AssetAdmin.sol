// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./interface/IAsset_.sol";

abstract contract AssetAdmin {

    // asset
    address public asset;

    constructor(address asset_) {
        // require(IOwnable(asset_).owner() == address(this), "AssetAdmin: wrong owner");
        asset = asset_;
    }

    function asset_registerAsset(
        address assetToken, 
        address assetOracle, 
        uint16 auctionDiscount, 
        uint16 minCRatio, 
        uint16 targetRatio, 
        bool isInPreIPO, 
        uint poolId, 
        IPOParams memory ipoParams
    ) internal {
        IAsset_(asset).registerAsset(assetToken, assetOracle, auctionDiscount, minCRatio, targetRatio, isInPreIPO, poolId, ipoParams);
    }

    function asset_updateAsset(
        address assetToken, 
        address assetOracle, 
        uint16 auctionDiscount, 
        uint16 minCRatio, 
        uint16 targetRatio, 
        bool isInPreIPO, 
        uint poolId, 
        IPOParams memory ipoParams
    ) external {
        IAsset_(asset).updateAsset(assetToken, assetOracle, auctionDiscount, minCRatio, targetRatio, isInPreIPO, poolId, ipoParams);
    }

    function asset_registerCollateral(address cAssetToken, address oracle, uint16 multiplier) external onlyOwner {
        IAsset_(asset).registerCollateral(cAssetToken, oracle, multiplier);
    }

    function asset_updateCollateral(address cAssetToken, address oracle, uint16 multiplier) external onlyOwner {
        IAsset_(asset).updateCollateral(cAssetToken, oracle, multiplier);
    }

    function asset_revokeCollateral(address cAssetToken) external onlyOwner {
        IAsset_(asset).revokeCollateral(cAssetToken);
    }

    function asset_triggerIPO(address assetToken) external onlyOwner {
        IAsset_(asset).triggerIPO(assetToken);
    }

    function asset_registerMigration(address assetToken, uint endPrice, uint8 endPriceDecimals) external onlyOwner {
        IAsset_(asset).registerMigration(assetToken, endPrice, endPriceDecimals);
    }

    function asset_setCollateralInPreIPO(address cAssetToken, bool value) external onlyOwner {
        IAsset_(asset).setCollateralInPreIPO(cAssetToken, value);
    }

    function setAsset(address asset_) external onlyOwner {
        // require(IOwnable(asset_).owner() == address(this), "AssetAdmin: wrong owner");
        asset = asset_;
    }

    modifier onlyOwner() virtual {
        _;
    }
}