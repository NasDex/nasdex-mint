// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../interface/IUniswapV2Router.sol";

library Swappable {
    function swapExactTokensForTokens(
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IUniswapV2Router(swapRouter)
            .swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
        amountOut = amounts[amounts.length - 1];
    }

    function swapExactTokensForETH(
        address swapRouter,
        address weth,
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = weth;

        uint256[] memory amounts = IUniswapV2Router(swapRouter)
            .swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline);
        amountOut = amounts[amounts.length - 1];
    }
}
