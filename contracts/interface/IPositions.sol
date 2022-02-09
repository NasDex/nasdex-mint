// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IAssetToken.sol";

struct Position {
    uint256 id;
    address owner;
    // collateral asset token.
    IERC20Extented cAssetToken;
    uint256 cAssetAmount;
    // nAsset token.
    IAssetToken assetToken;
    uint256 assetAmount;
    // if is it short position
    bool isShort;
    // 判断该空间是否已被分配
    bool assigned;
}

interface IPositions {
    function openPosition(
        address owner,
        IERC20Extented cAssetToken,
        uint256 cAssetAmount,
        IAssetToken assetToken,
        uint256 assetAmount,
        bool isShort
    ) external returns (uint256 positionId);

    function updatePosition(Position memory position_) external;

    function removePosition(uint256 positionId) external;

    function getPosition(uint256 positionId)
        external
        view
        returns (Position memory);

    function getNextPositionId() external view returns (uint256);

    function getPositions(
        address ownerAddr,
        uint256 startAt,
        uint256 limit
    ) external view returns (Position[] memory);
}
