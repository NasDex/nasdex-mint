const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const env = require("hardhat");
const { ethers } = require("hardhat");

// 0%
const FEE_RATE = 0;

let USDC_ADDR;
let WMATIC_ADDR;
let SWAP_ROUTER;
let NSDX_ADDR;
let MASTERCHEF_ADDR;

let ADMIN_ADDRESS;

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
    await libSwappable.deployTransaction.wait();
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

    print("Net work: " + env.network.name);

    // if(env.network.name == 'hardhat') {
    //     const usdcToken = await AssetToken.deploy("USD Coin", "USDC");
    //     await usdcToken.deployTransaction.wait();
    //     USDC_ADDR = usdcToken.address;
    //     masterChefInstance = await MasterChef.deploy(NSDX_ADDR, 1000, 10000, 10000000);
    //     await masterChefInstance.deployTransaction.wait();
    // } else {
    //     masterChefInstance = await MasterChef.attach(MASTERCHEF_ADDR);
    // }

    masterChefInstance = await MasterChef.attach(MASTERCHEF_ADDR);
}

async function deploy() {
    // deploy dependencies.
    print("-------start deploy....");
    assetInstance = await Asset.deploy();
    await assetInstance.deployTransaction.wait();
    print("------- 1");
    positionsInstance = await Positions.deploy();
    await positionsInstance.deployTransaction.wait();
    print("------- 2");
    // const usdcToken = await AssetToken.deploy("USD Coin", "USDC");
    shortLock = await ShortLock.deploy(
        ethers.constants.AddressZero,  // switch to mint address later
        BigNumber.from('604800') // a week
    );
    await shortLock.deployTransaction.wait();
    print("------- 3");
    let curBlockNumber = await ethers.provider.getBlockNumber();
    print("------- 4");
    shortStaking = await ShortStaking.deploy(
        NSDX_ADDR, 
        curBlockNumber + 100, 
        MASTERCHEF_ADDR, 
        ethers.constants.AddressZero // switch to mint address later
    );
    await shortStaking.deployTransaction.wait();
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
    await longStaking.deployTransaction.wait();
    print("------- 5");
    mintInstance = await Mint.deploy(
        FEE_RATE, 
        assetInstance.address,
        positionsInstance.address,
        USDC_ADDR, 
        shortLock.address,
        shortStaking.address,
        SWAP_ROUTER, // swapRouter address
        WMATIC_ADDR, // weth address
        deployer.address
    );
    await mintInstance.deployTransaction.wait();
    print("------- 6");
    await (await positionsInstance.transferOwnership(mintInstance.address)).wait();

    await (await shortLock.setMintAddr(mintInstance.address)).wait();
    await (await shortStaking.setMintAddr(mintInstance.address)).wait();

    multiCall = await MultiCall.deploy(
        assetInstance.address,
        positionsInstance.address,
        mintInstance.address,
        shortLock.address,
        shortStaking.address
    );
    await multiCall.deployTransaction.wait();
    print("------- 7");

    // let nextNonce = multiCall.deployTransaction.nonce + 6;
    // let nextContractAddress = ethers.utils.getContractAddress({
    //     from: deployer.address,
    //     nonce: nextNonce
    // });

    // print("next contract address will be: " + nextContractAddress);
    // print("------- 8");

    print("------- 9");

    // if(env.network.name == 'hardhat') {
    //     adminInstance = await Admin.deploy(
    //         ethers.constants.AddressZero,
    //         ethers.constants.AddressZero,
    //         ethers.constants.AddressZero,
    //         ethers.constants.AddressZero,
    //         ethers.constants.AddressZero,
    //         ethers.constants.AddressZero,
    //         ethers.constants.AddressZero
    //     );
    //     await adminInstance.deployTransaction.wait();
    // } else if(env.network.name == 'mumbai') {
    //     adminInstance = await Admin.attach(ADMIN_ADDRESS);
    // }

    adminInstance = await Admin.attach(ADMIN_ADDRESS);

    await (await adminInstance.setShortStaking(shortStaking.address)).wait();
    await (await adminInstance.setLongStaking(longStaking.address)).wait();
    await (await adminInstance.setShortLock(shortLock.address)).wait();
    await (await adminInstance.setAsset(assetInstance.address)).wait();
    await (await adminInstance.setMint(mintInstance.address)).wait();
    await (await adminInstance.setMasterChef(masterChefInstance.address)).wait();

    // transfer ownership to Admin contract.
    await (await shortStaking.transferOwnership(adminInstance.address)).wait();
    await (await longStaking.transferOwnership(adminInstance.address)).wait();
    await (await shortLock.transferOwnership(adminInstance.address)).wait();
    await (await assetInstance.transferOwnership(adminInstance.address)).wait();
    await (await mintInstance.transferOwnership(adminInstance.address)).wait();
    // await masterChefInstance.transferOwnership(adminInstance.address); // TODO transfer mamually later.

    print("------- 10");

    return {
        deployer: deployer,
        libSwappable: libSwappable,
        iAsset: assetInstance,
        iPositions: positionsInstance,
        iShortLock: shortLock,
        iShortStaking: shortStaking,
        iLongStaking: longStaking,
        iMint: mintInstance,
        iMultiCall: multiCall
    };
}

let openPrint = false;

function print(anything) {
    if(openPrint) {
        console.log(anything);
    }
}

exports.execute = async function execute(
    swapToAddr, 
    wmaticAddr, 
    routerAddr, 
    nsdxAddr, 
    masterChefAddr, 
    adminAddr, 
    _openPrint = false
) {
    USDC_ADDR = swapToAddr;
    WMATIC_ADDR = wmaticAddr;
    SWAP_ROUTER = routerAddr;
    NSDX_ADDR = nsdxAddr;
    MASTERCHEF_ADDR = masterChefAddr;
    ADMIN_ADDRESS = adminAddr;
    openPrint = _openPrint;

    [deployer] = await ethers.getSigners();

    await init();
    return (await deploy());
}