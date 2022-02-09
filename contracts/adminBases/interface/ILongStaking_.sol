// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IOwnable.sol";
import "../../interface/IStakingToken.sol";
import "../../interface/IUniswapPair.sol";

interface ILongStaking_ is IOwnable {
    function add(uint256 _rootPid, bool _withUpdate) external;

    function setMintAddr(address _mintAddr) external;

    function setNsdx(address _nsdx) external;

    function setMasterChef(address _masterChef) external;

    function setSwapV2Router(address _swapRouter) external;
}
