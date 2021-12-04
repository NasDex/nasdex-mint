// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interface/IAsset.sol";
import "./interface/IPositions.sol";
import "./interface/IShortLock.sol";
import "./interface/IShortStaking.sol";

contract MultiCall is Ownable {

    struct PositionInfo {
        Position position;
        AssetConfig assetConfig;
        CAssetConfig cAssetConfig;
        PositionLockInfo lockInfo;
        uint shortReward;
    }

    address public asset;
    address public positionContract;
    address public mint;
    address public lock;
    address public staking;

    constructor(
        address asset_,
        address positionContract_,
        address mint_,
        address lock_,
        address staking_
    ) {
        asset = asset_;
        positionContract = positionContract_;
        mint = mint_;
        lock = lock_;
        staking = staking_;
    }

    function getPositionInfo(uint positionId) external view returns(PositionInfo memory) {
        Position memory position = IPositions(positionContract).getPosition(positionId);
        AssetConfig memory assetConfig = IAsset(asset).asset(address(position.assetToken));
        CAssetConfig memory cAssetConfig = IAsset(asset).cAsset(address(position.cAssetToken));
        PositionLockInfo memory lockInfo;
        uint reward = 0;
        if (position.isShort) {
            // assetConfig.rootPid
            lockInfo = IShortLock(lock).lockInfoMap(positionId);
            reward = IShortStaking(staking).pendingNSDX(assetConfig.poolId, position.owner);
        }

        return PositionInfo(
            position,
            assetConfig,
            cAssetConfig,
            lockInfo,
            reward
        );
    }

    function setAsset(address asset_) external {
        asset = asset_;
    }

    function setPosition(address positionContract_) external {
        positionContract = positionContract_;
    }

    function setMint(address mint_) external {
        mint = mint_;
    }

    function setLock(address lock_) external {
        lock = lock_;
    }

    function setStaking(address staking_) external {
        staking = staking_;
    }
}