const { BigNumber } = require("@ethersproject/bignumber");
const { expect, assert } = require("chai");
const { loadFixture } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const { swapFixture, masterChefFixture } = require("./Fixtures");

let _iUSDCToken, _usdcDecimals;
let _iWETH, _iFactory, _iRouter;
let _iNsdxToken, _iMasterChef;
let _iAsset, _iPositions, _iShortLock, _iShortStaking, _iLongStaking, _iMint;
let _iNToken, _nTokenDecimals;
let _nTokenPrice, _iOracleSample;
let _mintFeeRate, _protocolFee;

describe("Mint contract short farm features", function() {
    before(async function() {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const { weth, factory, router, pair } = await loadFixture(swapFixture);
        _iWETH = weth;
        _iFactory = factory;
        _iRouter = router;

        const { nsdxToken, masterChef } = await loadFixture(masterChefFixture);
        _iNsdxToken = nsdxToken;
        _iMasterChef = masterChef;

        const USDCSample = await ethers.getContractFactory("USDCSample");
        _iUSDCToken = await USDCSample.deploy("USD Coin", "USDC");
        await _iUSDCToken.deployTransaction.wait();
        _usdcDecimals = BigNumber.from(10).pow(await _iUSDCToken.decimals());
        await _iUSDCToken.mint(owner.address, BigNumber.from("10000000000").mul(_usdcDecimals));

        const Admin = await ethers.getContractFactory("Admin");
        const iAdmin = await Admin.deploy(
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            factory.address
        );

        const deployment = require("../scripts/deploy.exe");
        const {
            deployer,
            libSwappable,
            iAsset,
            iPositions,
            iShortLock,
            iShortStaking,
            iLongStaking,
            iMint,
            iMultiCall
        } = await deployment.execute(
            _iUSDCToken.address,
            weth.address,
            router.address,
            nsdxToken.address,
            masterChef.address,
            iAdmin.address,
            false
        );
        _iAsset = iAsset;
        _iPositions = iPositions;
        _iShortLock = iShortLock;
        _iShortStaking = iShortStaking;
        _iLongStaking = iLongStaking;
        _iMint = iMint;
        
        await (await masterChef.transferOwnership(iAdmin.address)).wait();

        _mintFeeRate = await _iMint.feeRate();

        const OracleSample = await ethers.getContractFactory("OracleSample");
        _iOracleSample = await OracleSample.deploy(BigNumber.from('3500000000'), 8);
        await _iOracleSample.deployTransaction.wait();
        _nTokenPrice = 35;

        let tokenParams = {
            nTokenName: "Stock-A",
            nTokenSymbol: "nSTA",
            sTokenName: "Short Stock-A",
            sTokenSymbol: "sSTA",
        };
        let whiteListParams = {
            oracle: _iOracleSample.address,
            auctionDiscount: 800,
            minCRatio: 1500,
            targetRatio: 1800,
            isInPreIPO: false
        };

        let trans = await iAdmin.whiteList(
            tokenParams, 
            1000, 
            1000, 
            whiteListParams,
            {mintEnd:1000000, preIPOPrice:3000000, minCRatioAfterIPO:1500}
        );
    
        await trans.wait();

        trans = await iAdmin.asset_registerCollateral(_iUSDCToken.address, ethers.constants.AddressZero, 1);
        await trans.wait();

        trans = await iAdmin.shortLock_setLockPeriod(1);
        await trans.wait();

        let assetCount = await iAdmin.assetCount();
        let assetMember = await iAdmin.assetList(assetCount.sub(1));
        _iNToken = await ethers.getContractAt("IAssetToken", assetMember.nToken);
        _nTokenDecimals = BigNumber.from(10).pow(await _iNToken.decimals());

        await (await _iUSDCToken.approve(iMint.address, BigNumber.from("1000000000000000000000000000000"))).wait();
        await (await _iUSDCToken.approve(router.address, BigNumber.from("1000000000000000000000000000000"))).wait();
        await (await _iNToken.approve(iMint.address, BigNumber.from("1000000000000000000000000000000"))).wait();
        await (await _iNToken.approve(router.address, BigNumber.from("1000000000000000000000000000000"))).wait();

        trans = await _iMint.openPosition(
            assetMember.nToken,
            _iUSDCToken.address,
            BigNumber.from('50000000').mul(_usdcDecimals), // 50000000
            2000
        );
        await trans.wait();

        let myNTokenBalance = await _iNToken.balanceOf(owner.address);
        let myUSDCBalance = await _iUSDCToken.balanceOf(owner.address);
        let usdcToAdd = myNTokenBalance.div(_nTokenDecimals).mul(_nTokenPrice).mul(_usdcDecimals);

        trans = await router.addLiquidity(
            _iNToken.address,
            _iUSDCToken.address,
            myNTokenBalance,
            usdcToAdd,
            0,
            0,
            owner.address,
            BigNumber.from('10000000000000000000000')
        );

    });

    beforeEach(async function() {

    });

    afterEach(async function() {

    });

    after(async function() {

    });

    describe("openShortPosition", function() {
        it("Could open a short position", async function() {
            let nextId = await _iPositions.getNextPositionId();
            let usdcAmount = BigNumber.from('800').mul(_usdcDecimals);
            let nTokenAmount = usdcAmount.mul(_nTokenDecimals).div(_usdcDecimals).div(35).div(2);
            let transaction = await _iMint.openShortPosition(
                _iNToken.address,
                _iUSDCToken.address,
                usdcAmount,
                2000,
                0,
                BigNumber.from('10000000000000000000')
            );

            expect(transaction)
            .emit(_iPositions, 'OpenPosition')
            .withArgs(nextId);

            expect(transaction)
            .emit(_iShortStaking, 'Deposit')
            .withArgs(owner.address, 0, nTokenAmount);

            expect(await _iNToken.balanceOf(owner.address)).to.equal(0);
        });
    });

    describe("deposit", function() {
        it("Should emit event", async function() {
            await expect(_iMint.deposit(
                2, 
                BigNumber.from('200').mul(_usdcDecimals)
            )).emit(_iMint, "Deposit")
            .withArgs(2, BigNumber.from('200').mul(_usdcDecimals));
        });
    });

    describe("withdraw", function() {
        it("Should emit event", async function() {
            await expect(_iMint.withdraw(
                2, 
                BigNumber.from('200').mul(_usdcDecimals)
            )).emit(_iMint, "Withdraw")
            .withArgs(2, BigNumber.from('200').mul(_usdcDecimals));
        });
    });

    describe("mint", function() {
        it("Short staking should emit event", async function() {
            let position = await _iPositions.getPosition(2);
            let transaction = await _iMint.mint(
                2, 
                position.assetAmount.div(10),
                0,
                BigNumber.from('100000000000000000')
            );
            expect(transaction)
            .emit(_iMint, "MintAsset")
            .withArgs(2, position.assetAmount.div(10));

            expect(transaction)
            .emit(_iShortStaking, "Deposit")
            .withArgs(owner.address, 0, position.assetAmount.div(10));

            expect(await _iNToken.balanceOf(owner.address)).to.equal(0);
        });
    });

    describe("burn", function() {
        it("before burn", async function() {
            let position = await _iPositions.getPosition(2);
            let usdcAmount = await _iUSDCToken.balanceOf(owner.address);
            let nTokenAmount = position.assetAmount;
            await _iRouter.swapTokensForExactTokens(
                nTokenAmount,
                usdcAmount,
                [_iUSDCToken.address, _iNToken.address],
                owner.address,
                BigNumber.from('100000000000000000')
            );
        });

        it("Short staking should emit event", async function() {
            let position = await _iPositions.getPosition(2);
            let myBalance = await _iNToken.balanceOf(owner.address);
            await _iNToken.approve(_iMint.address, myBalance);
            let transaction = await _iMint.burn(
                2, 
                position.assetAmount.div(2)
            );

            expect(transaction)
            .emit(_iMint, "Burn")
            .withArgs(2, position.assetAmount.div(2));

            expect(transaction)
            .emit(_iShortStaking, "Withdraw")
            .withArgs(owner.address, 0, position.assetAmount.div(2));

            expect(await _iMint.protocolFee(_iUSDCToken.address)).to.equal(0);
        });

        it("Unlock USDC when period passed", async function(){
            for(i = 0; i < 10; i++) {
                await ethers.provider.send("evm_mine", []);
            }
            await (await _iShortLock.unlock(2)).wait();

            assert.isOk(true);
        });

        it("Should close position when burned all of nAsset", async function() {
            let position = await _iPositions.getPosition(2);
            let myBalance = await _iNToken.balanceOf(owner.address);
            await _iNToken.approve(_iMint.address, myBalance);
            let transaction = await _iMint.burn(
                2, 
                myBalance
            );

            expect(transaction)
            .emit(_iPositions, "ClosePosition")
            .withArgs(2);

            expect(transaction)
            .emit(_iShortStaking, "Withdraw")
            .withArgs(owner.address, 0, myBalance);

            expect(await _iMint.protocolFee(_iUSDCToken.address)).to.equal(0);

            expect(await _iNToken.balanceOf(owner.address)).to.equal(0);
        });
    });

    describe("isInAuction", function() {
        it("Should be liquidate", async function() {
            await _iMint.openPosition(
                _iNToken.address, 
                _iUSDCToken.address, 
                BigNumber.from('1000').mul(_usdcDecimals),
                2500
            );
            await _iOracleSample.setPrice(7000000000); // 35 -> 70
            
            expect(await _iMint.isInAuction(2)).to.equal(false);
            expect(await _iMint.isInAuction(3)).to.equal(true);
        });
    });

    describe("amountInAuction", function() {
        it("Get max burn amount and max retured collateral amount", async function() {
            let maxBurnAmount;
            let returedCAmount;

            let position = await _iPositions.getPosition(3);
            // console.log("collateral: " + position.cAssetAmount);
            // console.log("nAsset: " + position.assetAmount);

            await _iOracleSample.setPrice(6000000000); // 70 -> 60
            let arr = await _iMint.amountInAuction(3);
            maxBurnAmount = arr[0];
            returedCAmount = arr[1];
            // console.log("max burn amount: " + maxBurnAmount);
            // console.log("max retured collateral amount: " + returedCAmount);

            let c1 = position.cAssetAmount.sub(returedCAmount);
            let a1 = position.assetAmount.sub(maxBurnAmount);
            let cratio = c1.mul(_nTokenDecimals).mul(1000).div(_usdcDecimals).div(a1).div(60);
            // console.log("c-ratio: " + cratio / 1000);
            expect(cratio).to.be.closeTo(BigNumber.from(1800), 10);
        });
    })

    describe("auction", function() {
        let maxBurnAmount;
        let returedCAmount;

        it("before auction", async function() {
            let arr = await _iMint.amountInAuction(3);
            maxBurnAmount = arr[0];
            returedCAmount = arr[1];
            let usdcAmount = await _iUSDCToken.balanceOf(owner.address);
            let nTokenAmount = maxBurnAmount;
            await _iRouter.swapTokensForExactTokens(
                nTokenAmount,
                usdcAmount,
                [_iUSDCToken.address, _iNToken.address],
                owner.address,
                BigNumber.from('100000000000000000')
            );
        });

        it("Should emit event", async function() {
            let position = await _iPositions.getPosition(3);
            let preAssetAmount = position.assetAmount;
            // console.log("position: " + position);
            await _iOracleSample.setPrice(6000000000);

            let myBalance = await _iNToken.balanceOf(owner.address);
            await _iNToken.approve(_iMint.address, myBalance);
            await expect(_iMint.auction(3, maxBurnAmount))
            .emit(_iMint, "Auction").withArgs(3, maxBurnAmount);
            position = await _iPositions.getPosition(3);
            
            // let c1 = position.cAssetAmount.div(_usdcDecimals);
            // let a1 = position.assetAmount.div(_nTokenDecimals);
            let cratio = position.cAssetAmount.mul(_nTokenDecimals).mul(1000).div(_usdcDecimals).div(position.assetAmount).div(60);
            // console.log("c-ratio: " + cratio);
            expect(cratio).to.be.closeTo(BigNumber.from(1800), 10);

            // let liquidatedAmount = preAssetAmount.sub(position.assetAmount);
            // let _fee = liquidatedAmount.mul(50).mul(_mintFeeRate).mul(_usdcDecimals).div(_nTokenDecimals).div(1000);
            // protocolFee = _fee //protocolFee.add(_fee);
            // expect(await _iMint.protocolFee(_iUSDCToken.address)).to.equal(protocolFee);
        });
    });
});