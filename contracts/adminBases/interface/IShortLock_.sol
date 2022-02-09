// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IOwnable.sol";

interface IShortLock_ is IOwnable {
    function setMintAddr(address _mintAddr) external;

    function setLockPeriod(uint256 lockPeriod_) external;
}
