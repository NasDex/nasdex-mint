const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShortStaking cntract", function() {

    const START_BLOCK = 10;
    const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
    const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.

    let owner;
    let addr1;
    let addr2;

    let nsdxToken;
    let _shortToken;
    let camouflagedMint;
    let _masterChef;
    let _shortStaking;

    let poolId;

    before(async function() {
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const StakingToken = await ethers.getContractFactory("StakingToken");
        const MasterChef = await ethers.getContractFactory("MasterChef");
        const ShortStaking = await ethers.getContractFactory("ShortStaking");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        
        nsdxToken = await AssetToken.deploy("nsdex", "NSDX");
        _shortToken = await StakingToken.deploy("Short Token", "sA");
        camouflagedMint = owner;
        _masterChef = await MasterChef.deploy(
            nsdxToken.address, 
            REWARD_PER_BLOCK, 
            START_BLOCK, 
            NSDX_MAX_MINT
        );
        await nsdxToken.transferOwnership(_masterChef.address);
        _shortStaking = await ShortStaking.deploy(
            nsdxToken.address,
            START_BLOCK + 10,
            _masterChef.address,
            camouflagedMint.address
        );

        await _shortToken.transferOwnership(_shortStaking.address);

        await _masterChef.add(1000, _shortToken.address, false);
        let rootPoolId = (await _masterChef.poolLength()) - 1;
        await _shortStaking.add(rootPoolId, _shortToken.address, false);
        poolId = (await _shortStaking.poolLength()) - 1;

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
            expect(await _shortStaking.owner()).to.equal(owner.address);
        });

        it("Should can be transfer to another", async function () {
            await _shortStaking.transferOwnership(addr1.address);
            expect(await _shortStaking.owner()).to.equal(addr1.address);
            await _shortStaking.connect(addr1).transferOwnership(owner.address);
            expect(await _shortStaking.owner()).to.equal(owner.address);
        });
    });

    describe("Deposit", function() {
        it("Should can deposit", async function() {
            expect(
                await _shortStaking.deposit(
                    poolId,
                    BigNumber.from('10000000000000000000000'),
                    owner.address
                )
            )
            .to
            .emit(_shortStaking, "Deposit");
        })
    });

    describe("pendingNSDX", function() {
        it("Should have reward", async function() {
            expect(
                await _shortStaking.pendingNSDX(poolId, owner.address)
            )
            .to
            .above(0);
        })
    })

    describe("getReward", function() {
        it("Should can claim reward", async function() {
            expect(
                await _shortStaking.getReward(
                    poolId
                )
            )
            .to
            .emit(nsdxToken, "Transfer");
        });
    });

    describe("Withdraw", function() {
        it("Should can withdraw", async function() {
            expect(
                await _shortStaking.withdraw(
                    poolId,
                    BigNumber.from('10000000000000000000000'),
                    owner.address
                )
            )
            .to
            .emit(_shortStaking, "Withdraw")
            .withArgs(
                owner.address, 
                poolId, 
                BigNumber.from('10000000000000000000000')
            );
        });
    });
});