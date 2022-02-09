// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./interface/ILongStaking_.sol";

abstract contract LongStakingAdmin {
    // staking
    address public longStaking;

    constructor(address staking_) {
        // require(IOwnable(staking_).owner() == address(this), "LongStakingAdmin: wrong owner");
        longStaking = staking_;
    }

    function longStaking_add(uint256 _rootPid, bool _withUpdate)
        public
        onlyOwner
    {
        ILongStaking_(longStaking).add(_rootPid, _withUpdate);
    }

    function longStaking_setMintAddr(address _mintAddr) external onlyOwner {
        ILongStaking_(longStaking).setMintAddr(_mintAddr);
    }

    function longStaking_setNsdx(address _nsdx) external onlyOwner {
        ILongStaking_(longStaking).setNsdx(_nsdx);
    }

    function longStaking_setMasterChef(address _masterChef) external onlyOwner {
        ILongStaking_(longStaking).setMasterChef(_masterChef);
    }

    function setLongStaking(address staking_) external onlyOwner {
        // require(IOwnable(staking_).owner() == address(this), "LongStakingAdmin: wrong owner");
        longStaking = staking_;
    }

    modifier onlyOwner() virtual {
        _;
    }
}
