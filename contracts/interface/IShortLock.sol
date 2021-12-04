// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct PositionLockInfo {
    uint positionId;
    address receiver;
    IERC20 lockedToken; // address(1) means native token, such as ETH or MITIC.
    uint lockedAmount;
    uint unlockTime;
    bool assigned;
}

interface IShortLock {
    function lock(uint positionId, address receiver, address token, uint amount) external payable;
    function unlock(uint positionId) external;
    function release(uint positionId) external;
    function lockInfoMap(uint positionId) external view returns(PositionLockInfo memory);
}