// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC20Extented.sol";

interface IUniswapPair is IERC20Extented {
    function factory() external view returns (address);

    function token0() external view returns (address);

    function token1() external view returns (address);
}
