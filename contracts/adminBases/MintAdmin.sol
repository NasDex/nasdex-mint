// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./interface/IMint_.sol";

abstract contract MintAdmin {

    // mint
    address public mint;

    constructor(address mint_) {
        // require(IOwnable(mint_).owner() == address(this), "MintAdmin: wrong owner");
        mint = mint_;
    }

    function mint_updateState(
        address asset_,
        address positions_,
        uint oracleMaxDelay_,
        address swapToToken_,
        uint16 feeRate_,
        address lock_,
        address staking_,
        address swapRouter_
    ) external onlyOwner {
        IMint_(mint).updateState(
            asset_, 
            positions_, 
            oracleMaxDelay_, 
            swapToToken_, 
            feeRate_, 
            lock_, 
            staking_, 
            swapRouter_
        );
    }

    function setMint(address mint_) external onlyOwner {
        // require(IOwnable(mint_).owner() == address(this), "MintAdmin: wrong owner");
        mint = mint_;
    }

    modifier onlyOwner() virtual {
        _;
    }
}