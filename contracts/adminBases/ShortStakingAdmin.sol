// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./interface/IShortStaking_.sol";

abstract contract ShortStakingAdmin {
    // staking
    address public shortStaking;

    constructor(address staking_) {
        // require(IOwnable(staking_).owner() == address(this), "ShortStakingAdmin: wrong owner");
        shortStaking = staking_;
    }

    function shortStaking_add(
        uint256 _rootPid,
        address _shortToken,
        bool _withUpdate
    ) public onlyOwner {
        IShortStaking_(shortStaking).add(
            _rootPid,
            IStakingToken(_shortToken),
            _withUpdate
        );
    }

    function shortStaking_setMintAddr(address _mintAddr) external onlyOwner {
        IShortStaking_(shortStaking).setMintAddr(_mintAddr);
    }

    function shortStaking_setNsdx(address _nsdx) external onlyOwner {
        IShortStaking_(shortStaking).setNsdx(_nsdx);
    }

    function shortStaking_setMasterChef(address _masterChef)
        external
        onlyOwner
    {
        IShortStaking_(shortStaking).setMasterChef(_masterChef);
    }

    function setShortStaking(address staking_) external onlyOwner {
        // require(IOwnable(staking_).owner() == address(this), "ShortStakingAdmin: wrong owner");
        shortStaking = staking_;
    }

    modifier onlyOwner() virtual {
        _;
    }
}
