// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

// import "@openzeppelin/contracts/access/Ownable.sol";
// import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router.sol";
// import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "../interface/IUniswapV2Router.sol";

library Swappable {

    function swapExactTokensForTokens(
        IUniswapV2Router swapRouter,
        uint amountIn,
        uint amountOutMin,
        address tokenIn,
        address tokenOut,
        address to,
        uint deadline
    ) external returns (uint amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint[] memory amounts = swapRouter.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
        amountOut = amounts[amounts.length - 1];
    }

    function swapExactTokensForETH(
        IUniswapV2Router swapRouter,
        address weth,
        uint amountIn, 
        uint amountOutMin, 
        address tokenIn, 
        address to, 
        uint deadline
    ) external returns (uint amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = weth;

        uint[] memory amounts = swapRouter.swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline);
        amountOut = amounts[amounts.length - 1];
    }
}