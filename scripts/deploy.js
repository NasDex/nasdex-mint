const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const env = require("hardhat");
const { ethers } = require("hardhat");

// 1%
const FEE_RATE = 10;
const TOKEN_NAME_A = "Stock-A";
const TOKEN_SYMBOL_A = "nSTA";
const DISCOUNT = 800;
const MIN_CRATIO = 1800; // 1800 / 1000 = 180%

const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.

let USDT_ADDR = "0x519130DA1C46CF79F39A0339016c07c77f938fCB";
const WMATIC_ADDR = "0x22104669DA1a0a1B3631EdDee6b1B4d41c521F83";
const SWAP_FACTORY = "0x508B1F76B67381D8BF3aD24E4BFdC7109B03d7a2";
const SWAP_ROUTER = "0x60065e6B6d53aAd28C381FD9a4aa2ec839852e91";
const NSDX_ADDR = "0xe8673239c3213c9DC9590d31a2D311Ed3f71e0E9";
const MASTERCHEF_ADDR = "0xd2eC28268F9EeF81Ebaf79F4C5C2A8b807622b95";

const ADMIN_ADDRESS = "0x93D8Ddd2383Ace11397bcab11fDbc40c8420279d";

// contract type
let Asset;
let Positions;
let ShortLock;
let ShortStaking;
let LongStaking;
let Mint;
let AssetToken;
let OracleSample;
let MultiCall;
let Admin;
let MasterChef;

let assetInstance;
let positionsInstance;
let shortLock;
let shortStaking;
let longStaking;
let mintInstance;
let multiCall;
let libSwappable;
let masterChefInstance;
let adminInstance;

let oracleSample;
let nTokenA;

let deployer;

async function init() {
    Asset = await ethers.getContractFactory("Asset");
    Positions = await ethers.getContractFactory("Positions");
    ShortLock = await ethers.getContractFactory("ShortLock");
    ShortStaking = await ethers.getContractFactory("ShortStaking");
    LongStaking = await ethers.getContractFactory("LongStaking");
    AssetToken = await ethers.getContractFactory("AssetToken");
    OracleSample = await ethers.getContractFactory("OracleSample");

    // link library
    const Swappable = await ethers.getContractFactory("Swappable");
    libSwappable = await Swappable.deploy();
    Mint = await ethers.getContractFactory(
        "Mint",
        {
            libraries: {
                Swappable: libSwappable.address,
            },
        }
    );

    MultiCall = await ethers.getContractFactory("MultiCall");
    MasterChef = await ethers.getContractFactory("MasterChef");
    Admin = await ethers.getContractFactory("Admin");

    console.log("Net work: " + env.network.name);

    if(env.network.name == 'hardhat') {
        const usdtToken = await AssetToken.deploy("TetherUSD", "USDT");
        USDT_ADDR = usdtToken.address;
        masterChefInstance = await MasterChef.deploy(NSDX_ADDR, 1000, 10000, 10000000);
    } else {
        masterChefInstance = await MasterChef.attach(MASTERCHEF_ADDR);
    }
}

async function deploy() {
    // deploy dependencies.
    console.log("-------start deploy....");
    assetInstance = await Asset.deploy();
    console.log("------- 1");
    positionsInstance = await Positions.deploy();
    console.log("------- 2");
    // const usdtToken = await AssetToken.deploy("TetherUSD", "USDT");
    shortLock = await ShortLock.deploy(
        ethers.constants.AddressZero,  // switch to mint address later
        BigNumber.from('604800') // a week
    );
    console.log("------- 3");
    let curBlockNumber = await ethers.provider.getBlockNumber();
    console.log("------- 4");
    shortStaking = await ShortStaking.deploy(
        NSDX_ADDR, 
        curBlockNumber + 100, 
        MASTERCHEF_ADDR, 
        ethers.constants.AddressZero // switch to mint address later
    );
    // IERC20 _nsdx,
    // uint256 _startBlock,
    // IMasterChef _masterChef,
    // IUniswapV2Router _swapRouter
    longStaking = await LongStaking.deploy(
        NSDX_ADDR, 
        curBlockNumber + 100, 
        MASTERCHEF_ADDR, 
        SWAP_ROUTER
    );
    console.log("------- 5");
    mintInstance = await Mint.deploy(
        FEE_RATE, 
        assetInstance.address,
        positionsInstance.address,
        USDT_ADDR, 
        shortLock.address,
        shortStaking.address,
        SWAP_ROUTER, // swapRouter address
        WMATIC_ADDR // weth address
    );
    console.log("------- 6");
    await positionsInstance.transferOwnership(mintInstance.address);

    await shortLock.setMintAddr(mintInstance.address);
    await shortStaking.setMintAddr(mintInstance.address);

    multiCall = await MultiCall.deploy(
        assetInstance.address,
        positionsInstance.address,
        mintInstance.address,
        shortLock.address,
        shortStaking.address
    );

    console.log("------- 7");

    // let nextNonce = multiCall.deployTransaction.nonce + 6;
    // let nextContractAddress = ethers.utils.getContractAddress({
    //     from: deployer.address,
    //     nonce: nextNonce
    // });

    // console.log("next contract address will be: " + nextContractAddress);
    // console.log("------- 8");

    console.log("------- 9");

    if(env.network.name == 'hardhat') {
        adminInstance = await Admin.deploy(
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero
        );
    } else if(env.network.name == 'mumbai') {
        adminInstance = await Admin.attach(ADMIN_ADDRESS);
    }

    await adminInstance.setShortStaking(shortStaking.address);
    await adminInstance.setLongStaking(longStaking.address);
    await adminInstance.setShortLock(shortLock.address);
    await adminInstance.setAsset(assetInstance.address);
    await adminInstance.setMint(mintInstance.address);
    await adminInstance.setMasterChef(masterChefInstance.address);

    // transfer ownership to Admin contract.
    await shortStaking.transferOwnership(adminInstance.address);
    await longStaking.transferOwnership(adminInstance.address);
    await shortLock.transferOwnership(adminInstance.address);
    await assetInstance.transferOwnership(adminInstance.address);
    await mintInstance.transferOwnership(adminInstance.address);
    // await masterChefInstance.transferOwnership(adminInstance.address); // TODO transfer mamually later.

    console.log("------- 10");
    console .log("");
    console.log("Swappable lib address: " + libSwappable.address);
    console.log("Asset address: " + assetInstance.address);
    console.log("Positions address: " + positionsInstance.address);
    console.log("ShortLock address: " + shortLock.address);
    console.log("ShortStaking address: " + shortStaking.address);
    console.log("LongStaking address: " + longStaking.address);
    console.log("Mint address: " + mintInstance.address);
    console .log("");
    console.log("MultiCall address: " + multiCall.address);
    // console.log("Admin address: " + adminInstance.address);
}

async function main() {
    [deployer] = await ethers.getSigners();
    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    await init();
    await deploy();
    // await whitelist();
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});