const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LongStaking cntract", function() {

    const START_BLOCK = 10;
    const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
    const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.

    let owner;
    let addr1;
    let addr2;

    let nsdxToken;
    let _longToken;
    let camouflagedRouter;
    let camouflagedLPToken;
    let _masterChef;
    let _longStaking;

    let poolId;

    let lpTotalSupply = BigNumber.from("100000000000000000000000000000");
    let depositAmount = BigNumber.from('10000000000000000000000');
    let depositBlockNumber;

    before(async function() {
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const StakingToken = await ethers.getContractFactory("StakingToken");
        const MasterChef = await ethers.getContractFactory("MasterChef");
        const LongStaking = await ethers.getContractFactory("LongStaking");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        
        nsdxToken = await AssetToken.deploy("nsdex", "NSDX");
        _longToken = await StakingToken.deploy("Long Token", "lA");
        camouflagedRouter = owner;
        camouflagedLPToken = await StakingToken.deploy("LP A Token", "lpA");

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
            camouflagedRouter.address
        );

        await _longToken.transferOwnership(_longStaking.address);

        await _masterChef.add(1000, _longToken.address, false);
        let rootPoolId = (await _masterChef.poolLength()) - 1;
        await _longStaking.add(rootPoolId, _longToken.address, camouflagedLPToken.address, false);
        poolId = (await _longStaking.poolLength()) - 1;

        await camouflagedLPToken.mint(owner.address, lpTotalSupply);
        await camouflagedLPToken.approve(_longStaking.address, lpTotalSupply);

        for(i = 0; i < 20; i++) {
            await ethers.provider.send("evm_mine", []);
        }
    });

    beforeEach(async function() {
        for(i = 0; i < 10; i++) {
            await ethers.provider.send("evm_mine", []);
        }
        let block = await ethers.provider.getBlockNumber();
        console.log("current block is " + block);
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

    describe("Deposit", function() {
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
                await camouflagedLPToken.balanceOf(owner.address)
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
            let distNum = curNum - depositBlockNumber;
            let reward = REWARD_PER_BLOCK.mul(1000).div(2000).mul(distNum);
            expect(
                await _longStaking.getReward(
                    poolId
                )
            )
            .to
            .emit(nsdxToken, "Transfer")
            .withArgs(owner.address, reward);
        });
    });

    describe("Withdraw", function() {
        let withdrawAmount = depositAmount.div(2);
        let balance1;
        it("Should can withdraw", async function() {
            balance1 = await camouflagedLPToken.balanceOf(owner.address);
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
                await camouflagedLPToken.balanceOf(owner.address)
            )
            .to
            .equal(balance1.add(depositAmount));
        })
    });
});