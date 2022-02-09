// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./interface/IMasterChef_.sol";

abstract contract MasterChefAdmin {
    // master chef
    address public masterChef;

    constructor(address masterChef_) {
        // require(IOwnable(masterChef_).owner() == address(this), "MasterChefAdmin: wrong owner");
        masterChef = masterChef_;
    }

    function masterChef_updateMultiplier(uint256 multiplierNumber)
        external
        onlyOwner
    {
        IMasterChef_(masterChef).updateMultiplier(multiplierNumber);
    }

    function masterChef_add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        IMasterChef_(masterChef).add(_allocPoint, _lpToken, _withUpdate);
    }

    function masterChef_set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        IMasterChef_(masterChef).set(_pid, _allocPoint, _withUpdate);
    }

    function masterChef_setMaxMint(uint256 _nsdxMaxMint) external onlyOwner {
        IMasterChef_(masterChef).setMaxMint(_nsdxMaxMint);
    }

    function masterChef_setPerBlock(uint256 _nsdxPerBlock, bool _withUpdate)
        external
        onlyOwner
    {
        IMasterChef_(masterChef).setPerBlock(_nsdxPerBlock, _withUpdate);
    }

    function masterChef_transferNSDXOwnership(address _newOwner)
        external
        onlyOwner
    {
        IMasterChef_(masterChef).transferNSDXOwnership(_newOwner);
    }

    function setMasterChef(address masterChef_) external onlyOwner {
        // require(IOwnable(masterChef).owner() == address(this), "MasterChefAdmin: wrong owner");
        masterChef = masterChef_;
    }

    modifier onlyOwner() virtual {
        _;
    }
}
