// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./interface/IShortLock_.sol";

abstract contract ShortLockAdmin {

    // short lock
    address public shortLock;

    constructor(address shortLock_) {
        // require(IOwnable(shortLock_).owner() == address(this), "ShortLockAdmin: wrong owner");
        shortLock = shortLock_;
    }

    function shortLock_setMintAddr(address _mintAddr) external onlyOwner {
        IShortLock_(shortLock).setMintAddr(_mintAddr);
    }

    function shortLock_setLockPeriod(uint lockPeriod_) external onlyOwner {
        IShortLock_(shortLock).setLockPeriod(lockPeriod_);
    }

    function setShortLock(address shortLock_) external onlyOwner {
        // require(IOwnable(shortLock_).owner() == address(this), "ShortLockAdmin: wrong owner");
        shortLock = shortLock_;
    }

    modifier onlyOwner() virtual {
        _;
    }
}