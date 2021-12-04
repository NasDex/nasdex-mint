// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IOwnable.sol";
import "../../interface/IMasterChef.sol";

interface IMasterChef_ is IMasterChef, IOwnable {
    function updateMultiplier(uint256 multiplierNumber) external;
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) external;
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external;
    function setMaxMint(uint256 _nsdxMaxMint) external;
    function setPerBlock(uint256 _nsdxPerBlock, bool _withUpdate) external;
    function transferNSDXOwnership(address _newOwner) external;
}