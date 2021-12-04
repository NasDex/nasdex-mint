// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20Extented.sol";

interface IAssetToken is IERC20Extented {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function owner() external view;
}