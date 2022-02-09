// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./IStakingToken.sol";

interface IShortStaking {
    function pendingNSDX(uint256 _pid, address _user)
        external
        view
        returns (uint256);

    function deposit(
        uint256 _pid,
        uint256 _amount,
        address _realUser
    ) external;

    function withdraw(
        uint256 _pid,
        uint256 _amount,
        address _realUser
    ) external;

    function poolLength() external view returns (uint256);
}
