// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interface/IPositions.sol";

contract Positions is IPositions, Ownable {
    using Counters for Counters.Counter;

    // positionId => Position
    mapping(uint256 => Position) private _positionsMap;

    // user address => position[]
    mapping(address => uint256[]) private _positionIdsFromUser;

    Counters.Counter private _positionIdCounter;

    /// @notice Triggered when open a new position.
    /// @param positionId The index of this position.
    event OpenPosition(uint256 positionId);

    /// @notice Triggered when a position be closed.
    /// @param positionId The index of this position.
    event ClosePosition(uint256 positionId);

    constructor() {
        // Start at 1.
        _positionIdCounter.increment();
    }

    /// @notice Create a new position.
    /// @dev Only owner. The owner may always be Mint contract.
    /// @param owner Specify a user who will own the new position.
    /// @param cAssetToken The contract address of collateral token.
    /// @param cAssetAmount The amount of collateral token.
    /// @param assetToken The contract address of nAsset token.
    /// @param assetAmount The amount of nAsset token.
    /// @param isShort Is it a short position.
    /// @return positionId The index of the new position.
    function openPosition(
        address owner,
        IERC20Extented cAssetToken,
        uint256 cAssetAmount,
        IAssetToken assetToken,
        uint256 assetAmount,
        bool isShort
    ) external override onlyOwner returns (uint256 positionId) {
        positionId = _positionIdCounter.current();
        _positionIdCounter.increment();
        _positionsMap[positionId] = Position(
            positionId,
            owner,
            cAssetToken,
            cAssetAmount,
            assetToken,
            assetAmount,
            isShort,
            true
        );
        _positionIdsFromUser[owner].push(positionId);
        emit OpenPosition(positionId);
    }

    /// @notice Update the position.
    /// @dev Only owner. The owner may always be Mint contract.
    /// @param position_ The position which is going to be update.
    function updatePosition(Position memory position_)
        external
        override
        onlyOwner
    {
        _positionsMap[position_.id] = position_;
    }

    /// @notice Delete the position.
    /// @dev Only owner. The owner may always be Mint contract.
    /// @param positionId Position's index.
    function removePosition(uint256 positionId) external override onlyOwner {
        delete _positionsMap[positionId];
        emit ClosePosition(positionId);
    }

    /// @notice Get position by id
    /// @param positionId position id
    /// @return position
    function getPosition(uint256 positionId)
        external
        view
        override
        returns (Position memory)
    {
        return _positionsMap[positionId];
    }

    /// @notice get the next id
    /// @return current positionId + 1
    function getNextPositionId() external view override returns (uint256) {
        return _positionIdCounter.current();
    }

    /// @notice get positions under the owner
    /// @param ownerAddr owner address
    /// @param startAt it's a position id, returning positions will greater than it.
    /// @param limit how many positions do you want
    /// @return Position[]
    function getPositions(
        address ownerAddr,
        uint256 startAt,
        uint256 limit
    ) external view override returns (Position[] memory) {
        uint256[] memory arr = _positionIdsFromUser[ownerAddr];
        Position[] memory positions = new Position[](min(limit, arr.length));
        uint256 index = 0;
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] < startAt) {
                continue;
            }
            if (index >= limit) {
                break;
            }
            Position memory position = _positionsMap[arr[i]];
            if (position.assigned) {
                positions[index] = position;
                index += 1;
            }
        }

        return positions;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
