// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OracleSample is AggregatorV3Interface {

    int private _price;
    uint8 private _priceDecimals;

    constructor(int price_, uint8 priceDecimals_) {
        _price = price_;
        _priceDecimals = priceDecimals_;
    }
    
    function decimals() external view override returns(uint8) {
        return _priceDecimals;
    }

    function description() external pure override returns(string memory) {
        return "no description";
    }

    function version() external pure override returns(uint256) {
        return 1;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId) external view override returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
        return (_roundId, _price, block.timestamp, block.number, uint80(0));
    }

    function latestRoundData() external view override returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
        return (uint80(0), _price, block.timestamp, block.number, uint80(0));
    }

    function setPrice(int value) external {
        _price = value;
    }
}