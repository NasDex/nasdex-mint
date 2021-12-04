// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IOwnable.sol";

interface IMint_ is IOwnable {

    function swapToToken() external view returns(address);

    function updateState(
        address asset_,
        address positions_,
        uint oracleMaxDelay_,
        address swapToToken_,
        uint16 feeRate_,
        address lock_,
        address staking_,
        address swapRouter_
    ) external;
}