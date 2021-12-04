// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interface/IMasterChef.sol";
import "./interface/IStakingToken.sol";

import "hardhat/console.sol";

/// @title A staking contract for short token(slp).
/// @author Iwan
/// @notice It will mint short tokens when people 
/// @notice create a short position in 'Mint' contract,
/// @notice and short tokens will be staked into this contract immediately.
/// @dev Actually short token will be staked into 'MasterChef', and get rewards.
contract ShortStaking is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 constant MAX_UINT256 = 2**256 - 1;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    // @notice Info of each pool.
    struct PoolInfo {
        IStakingToken shortToken;   // Address of short token contract.
        uint256 lastRewardBlock;  // Last block number that NSDXs distribution occurs.
        uint256 accNSDXPerShare; // Accumulated NSDXs per share, times 1e12. See below.
        uint256 rootPid;            // pid in the MasterChef.
    }

    /// @notice The NSDX TOKEN!
    IERC20 public nsdx;

    /// @notice Mint contract address.
    address public mintAddr;

    /// @notice MasterChef contract address.
    IMasterChef public masterChef;

    /// @notice Info of each pool.
    PoolInfo[] public poolInfo;

    /// @dev Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;

    /// @notice The block number when NSDX mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param pid Triggered when add a new pool.
    event NewPool(uint256 pid);

    constructor(
        IERC20 _nsdx,
        uint256 _startBlock,
        IMasterChef _masterChef,
        address _mintAddr
    ) {
        require(address(_nsdx) != address(0), "the _nsdx address is zero");
        nsdx = _nsdx;
        startBlock = _startBlock;
        masterChef = _masterChef;
        mintAddr = _mintAddr;
    }

    /// @notice Size of pool array.
    /// @return The length of pool array.
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Add a new short lp to the pool. 
    /// @dev Can only be called by the owner.
    /// @dev DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    /// @param _rootPid The pid in MasterChef.
    /// @param _shortToken The contract address of the short token.
    /// @param _withUpdate It will execute update() for each pools if we set a 'true'.
    function add(uint256 _rootPid, IStakingToken _shortToken, bool _withUpdate) public onlyOwner {
        require(_shortToken.owner() == address(this), "add: the owner of short token must be this.");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        _shortToken.approve(address(masterChef), MAX_UINT256);
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        poolInfo.push(PoolInfo(_shortToken, lastRewardBlock, 0, _rootPid));

        emit NewPool(poolInfo.length - 1);
    }

    /// @notice Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /// @notice Update reward variables of the given pool to be up-to-date.
    /// @param _pid The index of the pool.
    /// @return pool Returns the pool that was updated
    function updatePool(uint256 _pid) public returns (PoolInfo memory pool){
        pool = poolInfo[_pid];
        if (block.number > pool.lastRewardBlock) {
            uint256 lpSupply = pool.shortToken.totalSupply();
            if (lpSupply > 0) {
                // uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
                // uint256 nsdxReward = multiplier.mul(nsdxPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
                // nsdxReward = safeNSDXMint(address(bar), nsdxReward);
                uint256 nsdxReward = masterChef.pendingNSDX(pool.rootPid, address(this));
                pool.accNSDXPerShare = pool.accNSDXPerShare.add(nsdxReward.mul(1e12).div(lpSupply));
            }
            pool.lastRewardBlock = block.number;
            poolInfo[_pid] = pool;
        }
    }

    /// @notice View function to see pending NSDXs on frontend.
    /// @dev Explain to a developer any extra details
    /// @param _pid Index of the pool.
    /// @param _user User's address.
    /// @return The pending NSDXs.
    function pendingNSDX(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accNSDXPerShare = pool.accNSDXPerShare;
        uint256 lpSupply = pool.shortToken.totalSupply();
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            // uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 nsdxReward = masterChef.pendingNSDX(pool.rootPid, address(this));
            accNSDXPerShare = accNSDXPerShare.add(nsdxReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accNSDXPerShare).div(1e12).sub(user.rewardDebt);
    }

    /// @notice Deposit short tokens to ShortStaking for NSDX allocation.
    /// @dev Only for 'Mint' contract.
    /// @dev Actually, we mint (_amount) short tokens and deposit to MasterChef.
    /// @param _pid The index of the pool.
    /// @param _amount Short token amount to deposit.
    /// @param _realUser The address of real user.
    function deposit(uint256 _pid, uint256 _amount, address _realUser) external onlyMint nonReentrant {
        require(_amount > 0, "deposit: amount must greater than zero.");
        require(_realUser != address(0), "deposit: cannot point to a zero address.");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_realUser];
        updatePool(_pid);

        // Deposit to masterChef.
        _masterDeposit(pool, _amount);

        if (user.amount > 0) {
            _getReward(pool, user, _realUser);
        }

        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accNSDXPerShare).div(1e12);
        emit Deposit(_realUser, _pid, _amount);
    }

    /// @notice Withdraw short tokens from ShortStaking.
    /// @dev Only for 'Mint' contract.
    /// @dev Actually, we withdraw (_amount) short tokens from MasterChef, and burn it.
    /// @param _pid The index of the pool.
    /// @param _amount Short token amount to withdraw.
    /// @param _realUser The address of real user.
    function withdraw(uint256 _pid, uint256 _amount, address _realUser) external onlyMint nonReentrant {
        _withdraw(_pid, _amount, _realUser);
    }

    /// @notice Claim rewards.
    /// @dev Everyone can execute if he/she is the real user.
    /// @param _pid The index of the pool.
    function getReward(uint256 _pid) external {
        _withdraw(_pid, 0, msg.sender);
    }

    function _withdraw(uint256 _pid, uint256 _amount, address _realUser) private {
        require(_realUser != address(0), "_withdraw: cannot point to a zero address.");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_realUser];
        require(user.amount >= _amount, "_withdraw: not good");

        updatePool(_pid);
        _masterWithdraw(pool, _amount);

        if (user.amount > 0) {
            _getReward(pool, user, _realUser);
        }

        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.shortToken.burn(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accNSDXPerShare).div(1e12);
        emit Withdraw(_realUser, _pid, _amount);
    }

    function _masterDeposit(PoolInfo memory _pool, uint256 _amount) private {
        _pool.shortToken.mint(address(this), _amount);
        masterChef.deposit(_pool.rootPid, _amount);
    }

    function _masterWithdraw(PoolInfo memory _pool, uint256 _amount) private {
        masterChef.withdraw(_pool.rootPid, _amount);
    }

    function _getReward(PoolInfo memory _pool, UserInfo memory _user, address _account) private {
        uint256 pending = _user.amount.mul(_pool.accNSDXPerShare).div(1e12).sub(_user.rewardDebt);
        if(pending > 0) {
            uint sendAmount = nsdx.balanceOf(address(this));
            if(sendAmount > pending) {
                sendAmount = pending;
            }
            nsdx.safeTransfer(_account, sendAmount);
        }
    }

    function setMintAddr(address _mintAddr) external onlyOwner {
        require(_mintAddr != address(0), "ShortStaking: cannot set a zero address.");
        mintAddr = _mintAddr;
    }

    function setNsdx(address _nsdx) external onlyOwner {
        nsdx = IERC20(_nsdx);
    }

    function setMasterChef(address _masterChef) external onlyOwner {
        masterChef = IMasterChef(_masterChef);
    }

    /// @dev Only Mint contract can execute.
    modifier onlyMint() {
        require(mintAddr == _msgSender(), "ShortStaking: caller is not the 'Mint' contract.");
        _;
    }
}
