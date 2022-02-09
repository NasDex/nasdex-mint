// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct PositionLockInfo {
    uint256 positionId;
    address receiver;
    IERC20 lockedToken; // address(1) means native token, such as ETH or MITIC.
    uint256 lockedAmount;
    uint256 unlockTime;
    bool assigned;
}

interface IShortLock {
    function lock(
        uint256 positionId,
        address receiver,
        address token,
        uint256 amount
    ) external payable;

    function unlock(uint256 positionId) external;

    function release(uint256 positionId) external;

    function lockInfoMap(uint256 positionId)
        external
        view
        returns (PositionLockInfo memory);
}
