const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Asset contract", function() {

    let nTokenB;
    let oracleSample;
    let assetInstance;
    let usdtToken;

    const TOKEN_NAME_B = "Stock-B";
    const TOKEN_SYMBOL_B = "nSTB";

    const DISCOUNT = 800;
    const MIN_CRATIO = 1800; // 1800 / 1000 = 180%
    const TARGET_CRATIO = 1900; // 190%

    before(async function() {
        const Asset = await ethers.getContractFactory("Asset");
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const OracleSample = await ethers.getContractFactory("OracleSample");

        assetInstance = await Asset.deploy();
        nTokenB = await AssetToken.deploy(TOKEN_NAME_B, TOKEN_SYMBOL_B);
        usdtToken = await AssetToken.deploy("TetherUSD", "USDT");
        oracleSample = await OracleSample.deploy(BigNumber.from('3500000000'), 8);
        // let _asset = await ethers.getContractAt("IAsset", assetInstance.address);
    });

    beforeEach(async function() {

    });

    afterEach(async function() {

    });

    after(async function() {

    });

    describe("RegisterAsset", function() {
        it("Should emit event", async function() {
            await expect(assetInstance.registerAsset(
                nTokenB.address,
                oracleSample.address,
                DISCOUNT,
                MIN_CRATIO,
                TARGET_CRATIO,
                false,
                1, // pid in masterchef
                {mintEnd:1000000, preIPOPrice:3000000, minCRatioAfterIPO:1500}
            )).to.emit(assetInstance, 'RegisterAsset')
            .withArgs(nTokenB.address);
        });
    });
});