const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mint cntract", function() {
    let Mint;
    let assetInstance;
    let positionsInstance;
    let mintInstance;
    let owner;
    let addr1;
    let nTokenA;
    let usdtToken;
    let oracleSample;

    // 0.2%
    const FEE_RATE = 2;

    const TOKEN_NAME_A = "Stock-A";
    const TOKEN_SYMBOL_A = "nSTA";
    
    const DISCOUNT = 800;
    const MIN_CRATIO = 1800; // 1800 / 1000 = 180%
    const TARGET_CRATIO = 1900; // 190%

    const START_BLOCK = 10000;
    const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
    const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.

    before(async function() {

        const Asset = await ethers.getContractFactory("Asset");
        const Positions = await ethers.getContractFactory("Positions");
        const Swappable = await ethers.getContractFactory("Swappable");
        const libSwappable = await Swappable.deploy();
        Mint = await ethers.getContractFactory(
            "Mint",
            {
                libraries: {
                    Swappable: libSwappable.address,
                },
            }
        );
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const OracleSample = await ethers.getContractFactory("OracleSample");
        const ShortLock = await ethers.getContractFactory("ShortLock");
        const ShortStaking = await ethers.getContractFactory("ShortStaking");
        const MasterChef = await ethers.getContractFactory("MasterChef");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        assetInstance = await Asset.deploy();
        positionsInstance = await Positions.deploy();

        nTokenA = await AssetToken.deploy(TOKEN_NAME_A, TOKEN_SYMBOL_A);
        usdtToken = await AssetToken.deploy("TetherUSD", "USDT");
        oracleSample = await OracleSample.deploy(BigNumber.from('3500000000'), 8);

        // ShortLock
        const shortLock = await ShortLock.deploy(
            ethers.constants.AddressZero,  // TODO wrong address
            BigNumber.from('10000000')
        );

        // MasterChef for test net
        const nsdxToken = await AssetToken.deploy("Nasdex", "NSDX");
        const masterChef = await MasterChef.deploy(
            nsdxToken.address, 
            REWARD_PER_BLOCK, 
            START_BLOCK, 
            NSDX_MAX_MINT
        );

        // ShortStaking
        const shortStaking = await ShortStaking.deploy(
            nsdxToken.address, 
            START_BLOCK + 100, 
            masterChef.address, 
            ethers.constants.AddressZero // TODO wrong address
        );

        // Mint
        mintInstance = await Mint.deploy(
            FEE_RATE, 
            assetInstance.address,
            positionsInstance.address,
            usdtToken.address, 
            shortLock.address,
            shortStaking.address,
            "0x0000000000000000000000000000000000000001", // TODO wrong address
            ethers.constants.AddressZero // TODO wrong address
        );

        await nTokenA.transferOwnership(mintInstance.address);
        
        await usdtToken.mint(owner.address, BigNumber.from('1000000000000000000000000'));
        // let myBalance = await usdtToken.balanceOf(owner.address);
        
        await assetInstance.registerAsset(
            nTokenA.address,
            oracleSample.address,
            DISCOUNT,
            MIN_CRATIO,
            TARGET_CRATIO,
            false,
            0, // pid in masterchef
            {mintEnd:1000000, preIPOPrice:3000000, minCRatioAfterIPO:1500}
        );
        await assetInstance.registerCollateral(usdtToken.address, ethers.constants.AddressZero, 1);
        await positionsInstance.transferOwnership(mintInstance.address);
        let myBalance = await usdtToken.balanceOf(owner.address);
        let trans = await usdtToken.approve(mintInstance.address, myBalance);
        // console.log("----------------Approve txhash: " + trans.hash);
    });

    beforeEach(async function() {
        // console.log("beforeEach");
    });

    afterEach(async function() {
        await oracleSample.setPrice(3500000000); // 35
    });

    after(async function() {

    });

    describe("Ownership", function() {
        it("Should set the right owner", async function () {
            expect(await mintInstance.owner()).to.equal(owner.address);
        });
      
        it("Should can be transfer to another", async function () {
            await mintInstance.transferOwnership(addr1.address);
            expect(await mintInstance.owner()).to.equal(addr1.address);
            await mintInstance.connect(addr1).transferOwnership(owner.address);
            expect(await mintInstance.owner()).to.equal(owner.address);
        });
    });

    describe("FeeRate", function() {
        it("FeeRate should be " + FEE_RATE + ".", async function() {
            expect(await mintInstance.feeRate()).to.equal(FEE_RATE);
        });
    });

    

    describe("openPosition", function() {
        it("Should emit event", async function() {
            await expect(mintInstance.openPosition(
                nTokenA.address, 
                usdtToken.address, 
                BigNumber.from('1000000000000000000000'),
                2500
            )).emit(positionsInstance, 'OpenPosition');
        });

        it("Position Should can be queried with an Id", async function() {
            let list = await positionsInstance.getPositions(owner.address, 1, 100);
            expect(list.length).to.equal(1);

            let position = await positionsInstance.getPosition(1);
            // console.log("position: " + position);
            // TODO Add calculations.
        });
    });

    describe("deposit", function() {
        it("Should emit event", async function() {
            await expect(mintInstance.deposit(
                1, 
                BigNumber.from('200000000000000000000')
            )).emit(mintInstance, "Deposit")
            .withArgs(1, BigNumber.from('200000000000000000000'));
        });
    });

    describe("withdraw", function() {
        it("Should emit event", async function() {
            // let position = await positionsInstance.getPosition(0);
            // console.log("position: " + position);
            await expect(mintInstance.withdraw(
                1, 
                BigNumber.from('200000000000000000000')
            )).emit(mintInstance, "Withdraw")
            .withArgs(1, BigNumber.from('200000000000000000000'));
        });
    });

    describe("mint", function() {
        it("Should emit event", async function() {
            let position = await positionsInstance.getPosition(1);
            await expect(mintInstance.mint(
                1, 
                position.assetAmount.div(10),
                0,
                1000000
            )).emit(mintInstance, "MintAsset")
            .withArgs(1, position.assetAmount.div(10));
        });
    });

    describe("burn", function() {
        it("Should emit event", async function() {
            let position = await positionsInstance.getPosition(1);
            let myBalance = await nTokenA.balanceOf(owner.address);
            await nTokenA.approve(mintInstance.address, myBalance);
            await expect(mintInstance.burn(
                1, 
                position.assetAmount.div(2)
            )).emit(mintInstance, "Burn")
            .withArgs(1, position.assetAmount.div(2));
        });

        it("Should close position when burned all of nAsset", async function() {
            let position = await positionsInstance.getPosition(1);
            let myBalance = await nTokenA.balanceOf(owner.address);
            await nTokenA.approve(mintInstance.address, myBalance);
            await expect(mintInstance.burn(
                1, 
                myBalance
            )).emit(positionsInstance, "ClosePosition")
            .withArgs(1);
        });
    });

    describe("isInAuction", function() {
        it("Should be liquidate", async function() {
            await mintInstance.openPosition(
                nTokenA.address, 
                usdtToken.address, 
                BigNumber.from('1000000000000000000000'),
                2500
            );
            await oracleSample.setPrice(7000000000); // 35 -> 70
            expect(await mintInstance.isInAuction(1)).to.equal(false);
            expect(await mintInstance.isInAuction(2)).to.equal(true);
        });
    });

    describe("amountInAuction", function() {
        it("Get max burn amount and max retured collateral amount", async function() {
            let maxBurnAmount;
            let returedCAmount;

            let position = await positionsInstance.getPosition(2);
            console.log("collateral: " + position.cAssetAmount);
            console.log("nAsset: " + position.assetAmount);

            await oracleSample.setPrice(5000000000); // 35 -> 50
            let arr = await mintInstance.amountInAuction(2);
            maxBurnAmount = arr[0];
            returedCAmount = arr[1];
            console.log("max burn amount: " + maxBurnAmount);
            console.log("max retured collateral amount: " + returedCAmount);

            let c1 = position.cAssetAmount.sub(returedCAmount).div(BigNumber.from('100000000000000000'));
            let a1 = position.assetAmount.sub(maxBurnAmount).div(BigNumber.from('100000000000000000'));
            let cratio = c1 / (a1 * 50);
            console.log("c-ratio: " + cratio);
        });
    })

    describe("auction", function() {
        it("Should emit event", async function() {
            let position = await positionsInstance.getPosition(2);
            // console.log("position: " + position);
            await oracleSample.setPrice(5000000000);
            let myBalance = await nTokenA.balanceOf(owner.address);
            await nTokenA.approve(mintInstance.address, myBalance);
            await expect(mintInstance.auction(2, myBalance.div(3)))
            .emit(mintInstance, "Auction").withArgs(2, myBalance.div(3));
            position = await positionsInstance.getPosition(2);
            
            let c1 = position.cAssetAmount.div(BigNumber.from('100000000000000000'));
            let a1 = position.assetAmount.div(BigNumber.from('100000000000000000'));
            let cratio = c1 / (a1 * 50);
            console.log("c-ratio: " + cratio);
        });
    })
});