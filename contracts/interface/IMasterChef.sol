// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMasterChef {
    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accNSDXPerShare;
    }

    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function pendingNSDX(uint256 _pid, address _user)
        external
        view
        returns (uint256);

    function userInfo(uint256 _pid, address _user)
        external
        view
        returns (uint256, uint256);

    function emergencyWithdraw(uint256 _pid) external;

    function poolLength() external view returns (uint256);

    function poolInfo(uint256 _pid) external view returns (PoolInfo memory);
}
