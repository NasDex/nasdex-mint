// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IAssetToken.sol";

struct Position{
    uint id;
    address owner;
    // collateral asset token.
    IERC20Extented cAssetToken;
    uint cAssetAmount;
    // nAsset token.
    IAssetToken assetToken;
    uint assetAmount;
    // if is it short position
    bool isShort;
    // 判断该空间是否已被分配
    bool assigned;
}

interface IPositions {
    function openPosition(
        address owner,
        IERC20Extented cAssetToken,
        uint cAssetAmount,
        IAssetToken assetToken,
        uint assetAmount,
        bool isShort
    ) external returns(uint positionId);

    function updatePosition(Position memory position_) external;

    function removePosition(uint positionId) external;

    function getPosition(uint positionId) external view returns(Position memory);
    function getNextPositionId() external view returns(uint);
    function getPositions(address ownerAddr, uint startAt, uint limit) external view returns(Position[] memory);
}