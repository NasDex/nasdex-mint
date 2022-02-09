const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const TOKEN_NAME_A = "Stock-A";
const TOKEN_SYMBOL_A = "nSTA";
const SHORT_TOKEN_NAME_A = "Short Stock-A";
const SHORT_TOKEN_SYMBOL_A = "sSTA";
const LONG_TOKEN_NAME_A = "Long Stock-A";
const LONG_TOKEN_SYMBOL_A = "lSTA";
const DISCOUNT = 800;
const MIN_CRATIO = 1500; // 1500 / 1000 = 150%
const TARGET_RATIO = 1800; // 180%

const ADMIN_ADDR = "0xC01bd61922702D06fA0EA91D2672AEba4Cd7E6d3";

// contract type
let Admin;

let _admin;

let tokenParams = {};
let whiteListParams = {};

async function init() {
    Admin = await ethers.getContractFactory("Admin");
    _admin = await Admin.attach(ADMIN_ADDR);

    await readParams();

    console.log(tokenParams);
    console.log(whiteListParams);

    // tokenParams = {
    //     nTokenName: TOKEN_NAME_A, 
    //     nTokenSymbol: TOKEN_SYMBOL_A, 
    //     sTokenName: SHORT_TOKEN_NAME_A, 
    //     sTokenSymbol: SHORT_TOKEN_SYMBOL_A, 
    // };

    // whiteListParams = {
    //     oracle: ORACLE_SAMPLE, 
    //     auctionDiscount: DISCOUNT, 
    //     minCRatio: MIN_CRATIO, 
    //     targetRatio: TARGET_RATIO, 
    //     isInPreIPO: false
    // }
}

async function readParams() {
    const readline = require('readline-sync');

    tokenParams.nTokenName = readline.question("Input nToken Name: ").trim();
    tokenParams.nTokenSymbol = readline.question("Input nToken symbol: ").trim();
    tokenParams.sTokenName = readline.question("Input sToken name: ").trim();
    tokenParams.sTokenSymbol = readline.question("Input sToken symbol: ").trim();

    let _oracle = readline.question("Input oracle address: ").trim();
    let _auctionDiscount = readline.question("Input auction discount(discount * 1000, e.g., 80% = 800, default:800): ").trim();
    if (_auctionDiscount == "") {
        _auctionDiscount = 800;
    } else {
        _auctionDiscount = parseInt(_auctionDiscount);
    }
    let _minCRatio = readline.question("Input min ratio(ratio * 1000, e.g., 150% = 1500, default:1500): ").trim();
    if (_minCRatio == "") {
        _minCRatio = 1500;
    } else {
        _minCRatio = parseInt(_minCRatio);
    }
    let _targetRatio = readline.question("Input target ratio(the ratio that will be liquidite to when position's ratio < min ratio, ratio * 1000, e.g., 150% = 1500, default:1800): ").trim();
    if (_targetRatio == "") {
        _targetRatio = 1800;
    } else {
        _targetRatio = parseInt(_targetRatio);
    }
    let _isInPreIPO = readline.question("Input is in preIPO(true/false, default: false): ").trim();
    if (_isInPreIPO == ("" || "false")) {
        _isInPreIPO = false;
    } else if (_isInPreIPO == "true") {
        _isInPreIPO = true;
    } else {
        _isInPreIPO = false;
    }

    whiteListParams.oracle = _oracle;
    whiteListParams.auctionDiscount = _auctionDiscount;
    whiteListParams.minCRatio = _minCRatio;
    whiteListParams.targetRatio = _targetRatio;
    whiteListParams.isInPreIPO = _isInPreIPO;
}

// struct WhiteListTokenParams {
//     string nTokenName;
//     string nTokenSymbol;
//     string sTokenName;
//     string sTokenSymbol;
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

    let trans = await _admin.whiteList(
        tokenParams,
        2000,
        4000,
        whiteListParams,
        { mintEnd: 1000000, preIPOPrice: 3000000, minCRatioAfterIPO: 1500 },
        { gasLimit: 7500000 }
    );

    await trans.wait();

    let assetCount = await _admin.assetCount();
    let assetMember = await _admin.assetList(assetCount.sub(1));
    console.log("nAsset token: " + assetMember.nToken);
    console.log("Short token: " + assetMember.sToken);
    console.log("Pair: " + assetMember.pair);

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