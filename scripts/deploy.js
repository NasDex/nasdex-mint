const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const env = require("hardhat");
const { ethers } = require("hardhat");
const { deployContract } = waffle;
const { deployMockContract } = require('@ethereum-waffle/mock-contract');

async function readParams() {
    let swapToAddr, wmaticAddr, swapRouterAddr, nsdxAddr, masterChefAddr, adminAddr;
    if (env.network.name == 'hardhat') {
        const [owner] = await ethers.getSigners();
        const USDCSample = await ethers.getContractFactory("USDCSample");
        const WETH9 = require("../test/artifacts/WETH9");
        const IUniswapV2Router = require("../artifacts/contracts/interface/IUniswapV2Router.sol/IUniswapV2Router");
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const IMasterChef = require("../artifacts/contracts/interface/IMasterChef.sol/IMasterChef");
        const Admin = await ethers.getContractFactory("Admin");
        const iAdmin = await Admin.deploy(
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero
        );
        await iAdmin.deployTransaction.wait();

        swapToAddr = (await USDCSample.deploy("USD Coin", "USDC")).address;
        wmaticAddr = (await deployContract(owner, WETH9)).address;
        swapRouterAddr = (await deployMockContract(owner, IUniswapV2Router.abi)).address;
        nsdxAddr = (await AssetToken.deploy("Nasdex", "NSDX")).address;
        masterChefAddr = (await deployMockContract(owner, IMasterChef.abi)).address;
        adminAddr = iAdmin.address;
    } else {
        const readline = require('readline-sync');
        swapToAddr = readline.question("Input swapTo address(e.g. USDC): ").trim();
        wmaticAddr = readline.question("Input a wrapped native token address(e.g. WETH or WMATIC): ").trim();
        swapRouterAddr = readline.question("Input swap router address: ").trim();
        nsdxAddr = readline.question("Input NSDX token address: ").trim();
        masterChefAddr = readline.question("Input masterChef address: ").trim();
        adminAddr = readline.question("Input admin(contract) address: ").trim();
    }

    return { swapToAddr, wmaticAddr, swapRouterAddr, nsdxAddr, masterChefAddr, adminAddr };
}

async function main() {
    const {
        swapToAddr,
        wmaticAddr,
        swapRouterAddr,
        nsdxAddr,
        masterChefAddr,
        adminAddr
    } = await readParams();

    // if(env.network.name == 'hardhat') {
    //     const usdcToken = await AssetToken.deploy("USD Coin", "USDC");
    //     await usdcToken.deployTransaction.wait();
    //     USDC_ADDR = usdcToken.address;
    //     masterChefInstance = await MasterChef.deploy(NSDX_ADDR, 1000, 10000, 10000000);
    //     await masterChefInstance.deployTransaction.wait();
    // } else {
    //     masterChefInstance = await MasterChef.attach(MASTERCHEF_ADDR);
    // }

    const deployment = require("./deploy.exe");
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
        swapToAddr,
        wmaticAddr,
        swapRouterAddr,
        nsdxAddr,
        masterChefAddr,
        adminAddr,
        true
    );

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    console.log("");
    console.log("Swappable lib address: " + libSwappable.address);
    console.log("Asset address: " + iAsset.address);
    console.log("Positions address: " + iPositions.address);
    console.log("ShortLock address: " + iShortLock.address);
    console.log("ShortStaking address: " + iShortStaking.address);
    console.log("LongStaking address: " + iLongStaking.address);
    console.log("Mint address: " + iMint.address);
    console.log("");
    console.log("MultiCall address: " + iMultiCall.address);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});