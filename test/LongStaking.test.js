const { loadFixture } = require("@ethereum-waffle/provider");
const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { swapFixture } = require("./Fixtures");

const {deployMockContract} = require('@ethereum-waffle/mock-contract');

const IUniswapPair = require("../artifacts/contracts/interface/IUniswapPair.sol/IUniswapPair");

describe("LongStaking cntract", function() {

    const START_BLOCK = 10;
    const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
    const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.

    let owner;
    let addr1;
    let addr2;

    let nsdxToken;
    // let _longToken;
    let _lpToken;
    let _masterChef;
    let _longStaking;

    let poolId;

    let lpTotalSupply;
    let depositAmount;
    let depositBlockNumber;

    let lpTokenDecimals;
    let token0Decimals;
    let token1Decimals;

    before(async function() {
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const StakingToken = await ethers.getContractFactory("StakingToken");
        const MasterChef = await ethers.getContractFactory("MasterChef");
        const LongStaking = await ethers.getContractFactory("LongStaking");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const { factory, router, pair } = await loadFixture(swapFixture);
        _lpToken = pair;
        lpTotalSupply = await pair.balanceOf(owner.address);
        const token0Addr = await pair.token0();
        const token1Addr = await pair.token1();
        const token0 = await AssetToken.attach(token0Addr);
        const token1 = await AssetToken.attach(token1Addr);

        lpTokenDecimals = BigNumber.from(10).pow(await _lpToken.decimals());
        token0Decimals = BigNumber.from(10).pow(await token0.decimals());
        token1Decimals = BigNumber.from(10).pow(await token1.decimals());
        // console.log("lp decimals: " + lpTokenDecimals.toString());
        // console.log("token0 decimals: " + token0Decimals.toString());
        // console.log("token1 decimals: " + token1Decimals.toString());

        depositAmount = BigNumber.from('10000').mul(lpTokenDecimals);
        // console.log("deposit amount: " + depositAmount.toString());
        
        nsdxToken = await AssetToken.deploy("nsdex", "NSDX");
        // _longToken = await StakingToken.deploy("Long Token", "lA");

        _masterChef = await MasterChef.deploy(
            nsdxToken.address, 
            REWARD_PER_BLOCK, 
            START_BLOCK, 
            NSDX_MAX_MINT
        );
        await nsdxToken.transferOwnership(_masterChef.address);
        _longStaking = await LongStaking.deploy(
            nsdxToken.address,
            START_BLOCK + 10,
            _masterChef.address,
            router.address
        );

        // await _longToken.transferOwnership(_longStaking.address);

        await _masterChef.add(1000, _lpToken.address, false);
        let rootPoolId = (await _masterChef.poolLength()) - 1;
        await _longStaking.add(rootPoolId, false);
        poolId = (await _longStaking.poolLength()) - 1;

        await _lpToken.approve(_longStaking.address, lpTotalSupply);
        await token0.approve(_longStaking.address, BigNumber.from('1000000000000000000000000000000'));
        await token1.approve(_longStaking.address, BigNumber.from('1000000000000000000000000000000'));

        for(i = 0; i < 20; i++) {
            await ethers.provider.send("evm_mine", []);
        }
    });

    beforeEach(async function() {
        for(i = 0; i < 10; i++) {
            await ethers.provider.send("evm_mine", []);
        }
        let block = await ethers.provider.getBlockNumber();
        // console.log("current block is " + block);
    });

    describe("Ownership", function() {
        it("Should set the right owner", async function() {
            expect(await _longStaking.owner()).to.equal(owner.address);
        });

        it("Should can be transfer to another", async function () {
            await _longStaking.transferOwnership(addr1.address);
            expect(await _longStaking.owner()).to.equal(addr1.address);
            await _longStaking.connect(addr1).transferOwnership(owner.address);
            expect(await _longStaking.owner()).to.equal(owner.address);
        });
    });

    describe("DepositLP", function() {
        it("Should can deposit", async function() {
            expect(
                await _longStaking.depositLP(
                    poolId,
                    depositAmount
                )
            )
            .to
            .emit(_longStaking, "Deposit");
            expect(
                await _lpToken.balanceOf(owner.address)
            )
            .to
            .equal(
                lpTotalSupply.sub(depositAmount)
            );
            depositBlockNumber = await ethers.provider.getBlockNumber();
        });
    });

    describe("pendingNSDX", function() {
        it("Should have reward", async function() {
            let curNum = await ethers.provider.getBlockNumber();
            let distNum = curNum - depositBlockNumber;
            // console.log("block passed: " + distNum);
            let reward = REWARD_PER_BLOCK.mul(1000).div(2000).mul(distNum);
            expect(
                await _longStaking.pendingNSDX(poolId, owner.address)
            )
            .to
            .equal(reward);
        });
    })

    describe("getReward", function() {
        it("Should can claim reward", async function() {
            let curNum = await ethers.provider.getBlockNumber();
            let distNum = curNum - depositBlockNumber + 1;
            let reward = REWARD_PER_BLOCK.mul(1000).div(2000).mul(distNum);
            await expect(
                () => _longStaking.getReward(
                    poolId
                )
            )
            .to
            .changeTokenBalances(
                nsdxToken,
                [_longStaking, owner],
                [0, reward]
            );
        });
    });

    describe("WithdrawLP", function() {
        let withdrawAmount;
        let balance1;
        it("Should can withdraw", async function() {
            withdrawAmount = depositAmount.div(2);
            balance1 = await _lpToken.balanceOf(owner.address);
            expect(
                await _longStaking.withdrawLP(
                    poolId,
                    withdrawAmount
                )
            )
            .to
            .emit(_longStaking, "Withdraw")
            .withArgs(
                owner.address, 
                poolId, 
                withdrawAmount
            );
        });

        it("Should have a correct balance", async function() {
            await _longStaking.withdrawLP(
                poolId,
                withdrawAmount
            );
            expect(
                await _lpToken.balanceOf(owner.address)
            )
            .to
            .equal(balance1.add(depositAmount));
        })
    });

    describe("Deposit", function() {
        it("Should can deposit", async function() {
            expect(
                await _longStaking.deposit(
                    poolId,
                    BigNumber.from('100').mul(token0Decimals),
                    BigNumber.from('100').mul(token1Decimals),
                    0,
                    0,
                    BigNumber.from('100000000000000000000')
                )
            )
            .to
            .emit(_longStaking, "Deposit");
            
            depositBlockNumber = await ethers.provider.getBlockNumber();
        });
    });

    describe("Withdraw", function() {
        it("Should can withdraw", async function() {
            const userInfo = await _longStaking.userInfo(poolId, owner.address);
            let withdrawAmount = userInfo.amount.div(2);
            // let balance1 = await _lpToken.balanceOf(owner.address);
            expect(
                await _longStaking.withdraw(
                    poolId,
                    withdrawAmount,
                    0,
                    0,
                    BigNumber.from('100000000000000000000')
                )
            )
            .to
            .emit(_longStaking, "Withdraw")
            .withArgs(
                owner.address, 
                poolId, 
                withdrawAmount
            );
        });
    });
});