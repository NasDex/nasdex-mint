const { BigNumber } = require("@ethersproject/bignumber");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Mint cntract", function() {
    let Mint;
    let assetInstance;
    let positionsInstance;
    let mintInstance;
    let owner;
    let addr1;
    let nTokenA;
    let usdcToken;
    let oracleSample;
    let shortLock;
    let shortStaking;

    let nTokenADecimals;
    let usdcDecimals;

    let protocolFee;

    // 0.2%
    const FEE_RATE = 2;

    const TOKEN_NAME_A = "Stock-A";
    const TOKEN_SYMBOL_A = "nSTA";
    
    const DISCOUNT = 800;
    const MIN_CRATIO = 1500; // 1500 / 1000 = 150%
    const TARGET_CRATIO = 1800; // 180%

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
        const USDCSample = await ethers.getContractFactory("USDCSample");
        const OracleSample = await ethers.getContractFactory("OracleSample");
        const ShortLock = await ethers.getContractFactory("ShortLock");
        const ShortStaking = await ethers.getContractFactory("ShortStaking");
        const MasterChef = await ethers.getContractFactory("MasterChef");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        assetInstance = await Asset.deploy();
        positionsInstance = await Positions.deploy();

        nTokenA = await AssetToken.deploy(TOKEN_NAME_A, TOKEN_SYMBOL_A);
        usdcToken = await USDCSample.deploy("USD Coin", "USDC");
        oracleSample = await OracleSample.deploy(BigNumber.from('3500000000'), 8);

        nTokenADecimals = BigNumber.from(10).pow(await nTokenA.decimals());
        usdcDecimals = BigNumber.from(10).pow(await usdcToken.decimals());

        // ShortLock
        shortLock = await ShortLock.deploy(
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
        shortStaking = await ShortStaking.deploy(
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
            usdcToken.address, 
            shortLock.address,
            shortStaking.address,
            "0x0000000000000000000000000000000000000001", // TODO wrong address
            ethers.constants.AddressZero, // TODO wrong address
            owner.address
        );

        await nTokenA.transferOwnership(mintInstance.address);
        
        await usdcToken.mint(owner.address, BigNumber.from('1000000').mul(usdcDecimals));
        // let myBalance = await usdcToken.balanceOf(owner.address);
        
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
        await assetInstance.registerCollateral(usdcToken.address, ethers.constants.AddressZero, 1);
        await positionsInstance.transferOwnership(mintInstance.address);
        let myBalance = await usdcToken.balanceOf(owner.address);
        let trans = await usdcToken.approve(mintInstance.address, myBalance);
        // console.log("----------------Approve txhash: " + trans.hash);
    });

    beforeEach(async function() {
        for(i = 0; i < 10; i++) {
            await ethers.provider.send("evm_mine", []);
        }
        let block = await ethers.provider.getBlockNumber();
        // console.log("current block is " + block);
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

    describe("updateState", function() {
        it("Could set the same swapTo param", async function() {
            const swapToAddr = await mintInstance.swapToToken();
            await mintInstance.updateState(
                assetInstance.address,
                positionsInstance.address,
                86400,
                swapToAddr,
                FEE_RATE,
                shortLock.address,
                shortStaking.address,
                "0x0000000000000000000000000000000000000001", // TODO wrong address
                owner.address
            );
            assert.isOk(true);
        });
    });

    describe("openPosition", function() {
        it("Should emit event", async function() {
            let usdcAmount = BigNumber.from('1000').mul(usdcDecimals);
            let nTokenAmount = usdcAmount.mul(nTokenADecimals).mul(10).div(usdcDecimals).div(35).div(25);
            let transaction = await mintInstance.openPosition(
                nTokenA.address, 
                usdcToken.address, 
                usdcAmount,
                2500
            );
            expect(transaction)
            .emit(positionsInstance, 'OpenPosition')
            .withArgs(1);

            expect(await nTokenA.balanceOf(owner.address)).to.equal(nTokenAmount);
        });

        it("Position Should can be queried with an Id", async function() {
            let list = await positionsInstance.getPositions(owner.address, 1, 100);
            expect(list.length).to.equal(1);
        });

        it("C-Ratio should be correct", async function() {
            let position = await positionsInstance.getPosition(1);
            let c = position.cAssetAmount.div(usdcDecimals);
            let a = position.assetAmount.div(nTokenADecimals);
            let cratio = c / (a * 35);
            cratio = position.cAssetAmount.mul(nTokenADecimals).mul(1000).div(usdcDecimals).div(position.assetAmount).div(35);
            // console.log("c-ratio: " + cratio);
            expect(cratio).to.equal(2500);
        });
    });

    describe("deposit", function() {
        it("Should emit event", async function() {
            await expect(mintInstance.deposit(
                1, 
                BigNumber.from('200').mul(usdcDecimals)
            )).emit(mintInstance, "Deposit")
            .withArgs(1, BigNumber.from('200').mul(usdcDecimals));
        });
    });

    describe("withdraw", function() {
        it("Should emit event", async function() {
            // let position = await positionsInstance.getPosition(0);
            // console.log("position: " + position);
            await expect(mintInstance.withdraw(
                1, 
                BigNumber.from('200').mul(usdcDecimals)
            )).emit(mintInstance, "Withdraw")
            .withArgs(1, BigNumber.from('200').mul(usdcDecimals));
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

            protocolFee = position.assetAmount.mul(35).mul(2).mul(usdcDecimals).div(2).div(nTokenADecimals).div(1000);
            expect(await mintInstance.protocolFee(usdcToken.address)).to.equal(protocolFee);
            // console.log("protocol fee: " + protocolFee);
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

            let _fee = myBalance.mul(35).mul(2).mul(usdcDecimals).div(nTokenADecimals).div(1000);
            protocolFee = protocolFee.add(_fee);
            expect(await mintInstance.protocolFee(usdcToken.address)).to.equal(protocolFee);
        });
    });

    describe("claimFee", function() {
        it("Could claim fee", async function() {
            await expect(() => mintInstance.claimFee(usdcToken.address, protocolFee))
            .to
            .changeTokenBalances(
                usdcToken,
                [mintInstance, owner],
                [protocolFee.mul(-1), protocolFee]
            );
        });
    });

    describe("isInAuction", function() {
        it("Should be liquidate", async function() {
            await mintInstance.openPosition(
                nTokenA.address, 
                usdcToken.address, 
                BigNumber.from('1000').mul(usdcDecimals),
                2500
            );
            await oracleSample.setPrice(6000000000); // 35 -> 60
            
            expect(await mintInstance.isInAuction(1)).to.equal(false);
            expect(await mintInstance.isInAuction(2)).to.equal(true);
        });
    });

    describe("amountInAuction", function() {
        it("Get max burn amount and max retured collateral amount", async function() {
            let maxBurnAmount;
            let returedCAmount;

            let position = await positionsInstance.getPosition(2);
            // console.log("collateral: " + position.cAssetAmount);
            // console.log("nAsset: " + position.assetAmount);

            await oracleSample.setPrice(6000000000); // 35 -> 60
            let arr = await mintInstance.amountInAuction(2);
            maxBurnAmount = arr[0];
            returedCAmount = arr[1];
            // console.log("max burn amount: " + maxBurnAmount);
            // console.log("max retured collateral amount: " + returedCAmount);

            let c1 = position.cAssetAmount.sub(returedCAmount);
            let a1 = position.assetAmount.sub(maxBurnAmount);
            let cratio = c1.mul(nTokenADecimals).mul(1000).div(usdcDecimals).div(a1).div(60);
            // console.log("c-ratio: " + cratio / 1000);
            expect(cratio).to.be.closeTo(BigNumber.from(1800), 10);
        });
    })

    describe("auction", function() {
        it("Should emit event", async function() {
            let maxBurnAmount;
            let returedCAmount;

            let position = await positionsInstance.getPosition(2);
            let preAssetAmount = position.assetAmount;
            // console.log("position: " + position);
            await oracleSample.setPrice(6000000000);

            let arr = await mintInstance.amountInAuction(2);
            maxBurnAmount = arr[0];
            returedCAmount = arr[1];

            let myBalance = await nTokenA.balanceOf(owner.address);
            await nTokenA.approve(mintInstance.address, myBalance);
            await expect(mintInstance.auction(2, maxBurnAmount))
            .emit(mintInstance, "Auction").withArgs(2, maxBurnAmount);
            position = await positionsInstance.getPosition(2);
            
            // let c1 = position.cAssetAmount.div(usdcDecimals);
            // let a1 = position.assetAmount.div(nTokenADecimals);
            let cratio = position.cAssetAmount.mul(nTokenADecimals).mul(1000).div(usdcDecimals).div(position.assetAmount).div(60);
            // console.log("c-ratio: " + cratio);
            expect(cratio).to.be.closeTo(BigNumber.from(1800), 10);

            let liquidatedAmount = preAssetAmount.sub(position.assetAmount);
            let _fee = liquidatedAmount.mul(60).mul(2).mul(usdcDecimals).div(nTokenADecimals).div(1000);
            protocolFee = _fee //protocolFee.add(_fee);
            expect(await mintInstance.protocolFee(usdcToken.address)).to.equal(protocolFee);
        });
    });

    describe("claimFee", function() {
        it("Could claim fee", async function() {
            await expect(() => mintInstance.claimFee(usdcToken.address, protocolFee))
            .to
            .changeTokenBalances(
                usdcToken,
                [mintInstance, owner],
                [protocolFee.mul(-1), protocolFee]
            );
        });
    });
});