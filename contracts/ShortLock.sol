// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IShortLock.sol";

/// @title A contract can lock funds for a short position.
/// @author Iwan
/// @notice When people create a short position, 
/// @notice the minted nAsset in Mint contract will be sold. 
/// @notice The funds after selling will be locked into this contract.
contract ShortLock is Ownable {

    using SafeERC20 for IERC20;

    /// @dev address(1) means native token, such as ETH or MATIC.
    address constant public NATIVE_TOKEN = address(1);

    /// @notice Mint contract address.
    address public mintAddr;

    /// @notice A period that we lock funds for each position.
    uint public lockPeriod;

    mapping(uint => PositionLockInfo) public lockInfoMap;

    constructor(address mintAddr_, uint lockPeriod_) {
        mintAddr = mintAddr_;
        lockPeriod = lockPeriod_;
    }

    /// @notice Lock funds when creating a short position or mint nAsset from an existing short position.
    /// @dev Only Mint contract can execute.
    /// @param positionId Position index in Mint contract.
    /// @param receiver It will often be the owner of the position.
    /// @param token Contract address of the token which is going to be locked.
    /// @param amount Amount which is going to be locked.
    function lock(uint positionId, address receiver, address token, uint amount) external payable onlyMint {
        require(receiver != address(0), "lock: don't point to a zero address.");
        require(token != address(0), "lock: wrong token address.");
        PositionLockInfo memory lockInfo = lockInfoMap[positionId];
        if(lockInfo.assigned) {
            require(lockInfo.receiver == receiver, "lock: wrong receiver address.");
            require(lockInfo.lockedToken == IERC20(token), "lock: a strange token address.");
            lockInfo.lockedAmount += amount;
            lockInfo.unlockTime = block.timestamp + lockPeriod;
        } else {
            lockInfo = PositionLockInfo(positionId, receiver, IERC20(token), amount, block.timestamp + lockPeriod, true);
        }

        if(token == NATIVE_TOKEN) {
            require(msg.value == amount, "lock: wrong native token amount.");
        } else {
            lockInfo.lockedToken.safeTransferFrom(msg.sender, address(this), amount);
        }
        
        lockInfoMap[positionId] = lockInfo;
    }

    /// @notice Unlock funds, only when lock period is exceeded.
    /// @param positionId Position index in Mint contract.
    function unlock(uint positionId) external {
        PositionLockInfo memory lockInfo = lockInfoMap[positionId];
        require(lockInfo.assigned, "unlock: no such a lock info.");
        require(lockInfo.lockedAmount > 0, "unlock: no balance to unlock");
        require(msg.sender == lockInfo.receiver, "unlock: you are not the receiver.");
        require(block.timestamp >= lockInfo.unlockTime, "unlock: it's not yet time to unlock.");

        if(address(lockInfo.lockedToken) == NATIVE_TOKEN) {
            payable(msg.sender).transfer(lockInfo.lockedAmount);
        } else {
            lockInfo.lockedToken.safeTransfer(msg.sender, lockInfo.lockedAmount);
        }
        
        delete lockInfoMap[positionId];
    }

    /// @notice Unlock funds directly, ignore lock period.
    /// @dev Only Mint contract can execute.
    /// @param positionId Position index in Mint contract.
    function release(uint positionId) external onlyMint {
        PositionLockInfo memory lockInfo = lockInfoMap[positionId];
        require(lockInfo.assigned, "unlock: no such a lock info.");

        if(address(lockInfo.lockedToken) == NATIVE_TOKEN) {
            payable(msg.sender).transfer(lockInfo.lockedAmount);
        } else {
            lockInfo.lockedToken.safeTransfer(msg.sender, lockInfo.lockedAmount);
        }
        
        delete lockInfoMap[positionId];
    }

    function setMintAddr(address _mintAddr) external onlyOwner {
        require(_mintAddr != address(0), "setMintAddr: cannot set a zero address.");
        mintAddr = _mintAddr;
    }

    function setLockPeriod(uint lockPeriod_) external onlyOwner {
        lockPeriod = lockPeriod_;
    }

    /// @dev Only Mint contract can execute.
    modifier onlyMint() {
        require(mintAddr == _msgSender(), "ShortStaking: caller is not the 'Mint' contract.");
        _;
    }
}