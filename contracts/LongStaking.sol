// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interface/IMasterChef.sol";
import "./interface/IStakingToken.sol";
import "./interface/IUniswapV2Router.sol";
import "./interface/IUniswapPair.sol";

import "hardhat/console.sol";

contract LongStaking is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IUniswapPair;

    uint256 constant MAX_UINT256 = 2**256 - 1;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    // @notice Info of each pool.
    struct PoolInfo {
        IStakingToken longToken;   // Address of long token contract.
        IUniswapPair lpToken;
        uint256 lastRewardBlock;  // Last block number that NSDXs distribution occurs.
        uint256 accNSDXPerShare; // Accumulated NSDXs per share, times 1e12. See below.
        uint256 rootPid;            // pid in the MasterChef.
    }

    /// @notice The NSDX TOKEN!
    IERC20 public nsdx;

    /// @notice MasterChef contract address.
    IMasterChef public masterChef;

    /// @notice Info of each pool.
    PoolInfo[] public poolInfo;

    IUniswapV2Router public swapRouter;

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
        IUniswapV2Router _swapRouter
    ) {
        require(address(_nsdx) != address(0), "the _nsdx address is zero");
        nsdx = _nsdx;
        startBlock = _startBlock;
        masterChef = _masterChef;
        swapRouter = _swapRouter;
    }

    /// @notice Size of pool array.
    /// @return The length of pool array.
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Add a new long lp to the pool. 
    /// @dev Can only be called by the owner.
    /// @dev DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    /// @param _rootPid The pid in MasterChef.
    /// @param _longToken The contract address of the long token.
    /// @param _withUpdate It will execute update() for each pools if we set a 'true'.
    function add(uint256 _rootPid, IStakingToken _longToken, IUniswapPair _lpToken, bool _withUpdate) public onlyOwner {
        require(_longToken.owner() == address(this), "add: the owner of long token must be this.");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        IERC20 tokenA = IERC20(_lpToken.token0());
        IERC20 tokenB = IERC20(_lpToken.token1());
        tokenA.approve(address(masterChef), MAX_UINT256);
        tokenB.approve(address(masterChef), MAX_UINT256);
        _longToken.approve(address(masterChef), MAX_UINT256);
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        poolInfo.push(PoolInfo(_longToken, _lpToken, lastRewardBlock, 0, _rootPid));

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
            uint256 lpSupply = pool.longToken.totalSupply();
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
        uint256 lpSupply = pool.longToken.totalSupply();
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            // uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 nsdxReward = masterChef.pendingNSDX(pool.rootPid, address(this));
            accNSDXPerShare = accNSDXPerShare.add(nsdxReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accNSDXPerShare).div(1e12).sub(user.rewardDebt);
    }

    function deposit(
        uint256 _pid, 
        uint256 _amountA, 
        uint256 _amountB,
        uint256 _amountAMin, 
        uint256 _amountBMin, 
        uint256 _deadline
    ) external {
        require(_amountA > 0, "deposit: amountA must greater than zero.");
        require(_amountB > 0, "deposit: amountB must greater than zero.");
        PoolInfo storage pool = poolInfo[_pid];
        IERC20 tokenA = IERC20(pool.lpToken.token0());
        IERC20 tokenB = IERC20(pool.lpToken.token1());
        tokenA.safeTransferFrom(msg.sender, address(this), _amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), _amountB);
        uint256 amountA;
        uint256 amountB;
        uint256 lpAmount;
        (amountA, amountB, lpAmount) = _addLiquidity(
            tokenA, 
            tokenB, 
            _amountA, 
            _amountB, 
            _amountAMin, 
            _amountBMin, 
            _deadline
        );
        if(_amountA > amountA) {
            tokenA.safeTransfer(msg.sender, _amountA - amountA);
        }
        if(_amountB > amountB) {
            tokenB.safeTransfer(msg.sender, _amountB - amountB);
        }
        deposit(_pid, lpAmount, msg.sender);
    }

    function depositLP(uint256 _pid, uint256 _amount) external {
        require(_amount > 0, "deposit: amount must greater than zero.");
        PoolInfo storage pool = poolInfo[_pid];
        pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);

        deposit(_pid, _amount, msg.sender);
    }

    /// @notice Deposit long tokens to LongStaking for NSDX allocation.
    /// @dev Only for 'Mint' contract.
    /// @dev Actually, we mint (_amount) long tokens and deposit to MasterChef.
    /// @param _pid The index of the pool.
    /// @param _amount Long token amount to deposit.
    /// @param _realUser The address of real user.
    function deposit(uint256 _pid, uint256 _amount, address _realUser) internal nonReentrant {
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

    /// @notice Withdraw long tokens from LongStaking.
    /// @dev Only for 'Mint' contract.
    /// @dev Actually, we withdraw (_amount) long tokens from MasterChef, and burn it.
    /// @param _pid The index of the pool.
    /// @param _amount Long token amount to withdraw.
    function withdraw(
        uint256 _pid, 
        uint256 _amount, 
        uint256 _amountAMin, 
        uint256 _amountBMin, 
        uint256 _deadline
    ) external nonReentrant {
        _withdraw(
            _pid, 
            _amount, 
            msg.sender, 
            false, 
            _amountAMin,
            _amountBMin,
            _deadline
        );
    }

    function withdrawLP(
        uint256 _pid, 
        uint256 _amount
    ) external nonReentrant {
        _withdraw(
            _pid, 
            _amount, 
            msg.sender, 
            true, 
            0,
            0,
            10000000000000
        );
    }

    /// @notice Claim rewards.
    /// @dev Everyone can execute if he/she is the real user.
    /// @param _pid The index of the pool.
    function getReward(uint256 _pid) external {
        _withdraw(_pid, 0, msg.sender, false, 0, 0, 10000000000000);
    }

    function _withdraw(
        uint256 _pid, 
        uint256 _amount, 
        address _realUser,
        bool _isLP, 
        uint256 _amountAMin, 
        uint256 _amountBMin, 
        uint256 _deadline
    ) private {
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
            pool.longToken.burn(_amount);
            if(_isLP) {
                pool.lpToken.safeTransfer(_realUser, _amount);
            } else {
                _removeLiquidity(
                    pool.lpToken, 
                    _amount, 
                    _realUser,
                    _amountAMin,
                    _amountBMin,
                    _deadline
                );
            }
        }
        user.rewardDebt = user.amount.mul(pool.accNSDXPerShare).div(1e12);
        emit Withdraw(_realUser, _pid, _amount);
    }

    function _addLiquidity(
        IERC20 _tokenA, 
        IERC20 _tokenB, 
        uint256 _amountA, 
        uint256 _amountB, 
        uint256 _amountAMin, 
        uint256 _amountBMin, 
        uint256 _deadline
    ) private returns(uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB, liquidity) = swapRouter.addLiquidity(
            address(_tokenA), 
            address(_tokenB), 
            _amountA, 
            _amountB, 
            _amountAMin, 
            _amountBMin, 
            address(this), 
            _deadline
        );
    }

    function _removeLiquidity(
        IUniswapPair _lpToken, 
        uint256 _amount, 
        address _realUser, 
        uint256 _amountAMin, 
        uint256 _amountBMin, 
        uint256 _deadline
    ) private returns(uint256 amountA, uint256 amountB) {
        IERC20 tokenA = IERC20(_lpToken.token0());
        IERC20 tokenB = IERC20(_lpToken.token1());
        (amountA, amountB) = swapRouter.removeLiquidity(
            address(tokenA), 
            address(tokenB), 
            _amount, 
            _amountAMin, 
            _amountBMin, 
            _realUser, 
            _deadline
        );
    }

    function _masterDeposit(PoolInfo memory _pool, uint256 _amount) private {
        _pool.longToken.mint(address(this), _amount);
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

    function setNsdx(address _nsdx) external onlyOwner {
        nsdx = IERC20(_nsdx);
    }

    function setMasterChef(address _masterChef) external onlyOwner {
        masterChef = IMasterChef(_masterChef);
    }

    function setSwapV2Router(address _swapRouter) external onlyOwner {
        swapRouter = IUniswapV2Router(_swapRouter);
    }
}
