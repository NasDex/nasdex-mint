// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IOwnable.sol";
import "../../interface/IShortStaking.sol";

interface IShortStaking_ is IShortStaking, IOwnable {
    function add(
        uint256 _rootPid,
        IStakingToken _shortToken,
        bool _withUpdate
    ) external;

    function setMintAddr(address _mintAddr) external;

    function setNsdx(address _nsdx) external;

    function setMasterChef(address _masterChef) external;
}
