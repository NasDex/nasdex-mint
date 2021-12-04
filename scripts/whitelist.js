const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const TOKEN_NAME_A = "Stock-A";
const TOKEN_SYMBOL_A = "nSTA";
const SHORT_TOKEN_NAME_A = "Short Stock-A";
const SHORT_TOKEN_SYMBOL_A = "sSTA";
const LONG_TOKEN_NAME_A = "Long Stock-A";
const LONG_TOKEN_SYMBOL_A = "lSTA";
const DISCOUNT = 800;
const MIN_CRATIO = 1800; // 1800 / 1000 = 180%
const TARGET_RATIO = 1900; // 190%

const ORACLE_SAMPLE = "0x2349a2522143E80e6014acd608B24146a9c9e4E9";
const ADMIN_ADDR = "0x93D8Ddd2383Ace11397bcab11fDbc40c8420279d";

// contract type
let Admin;

let _admin;

async function init() {
    Admin = await ethers.getContractFactory("Admin");
    _admin = await Admin.attach(ADMIN_ADDR);
}

// struct WhiteListTokenParams {
//     string nTokenName;
//     string nTokenSymbol;
//     string sTokenName;
//     string sTokenSymbol;
//     string lTokenName;
//     string lTokenSymbol;
// }

// struct WhiteListParams {
//     AggregatorV3Interface oracle;
//     uint16 auctionDiscount;
//     uint16 minCRatio;
//     uint16 targetRatio;
//     bool isInPreIPO;
// }

// function whiteList(
//     WhiteListTokenParams memory tokenParams, 
//     uint sAllocPoint_,
//     uint lAllocPoint_,
//     WhiteListParams memory whiteListParams, 
//     IPOParams memory ipoParams
// ) external

async function whitelist() {

    let tokenParams = {
        nTokenName: TOKEN_NAME_A, 
        nTokenSymbol: TOKEN_SYMBOL_A, 
        sTokenName: SHORT_TOKEN_NAME_A, 
        sTokenSymbol: SHORT_TOKEN_SYMBOL_A, 
        lTokenName: LONG_TOKEN_NAME_A, 
        lTokenSymbol: LONG_TOKEN_SYMBOL_A
    };

    let whiteListParams = {
        oracle: ORACLE_SAMPLE, 
        auctionDiscount: DISCOUNT, 
        minCRatio: MIN_CRATIO, 
        targetRatio: TARGET_RATIO, 
        isInPreIPO: false
    }

    let trans = await _admin.whiteList(
        tokenParams, 
        1000, 
        1000, 
        whiteListParams,
        {mintEnd:1000000, preIPOPrice:3000000, minCRatioAfterIPO:1500}
    );

    console.log("white list: " + trans.hash);
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Register a nAsset in Asset contract."
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    await init();
    await whitelist();
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});