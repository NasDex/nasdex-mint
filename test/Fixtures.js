const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const {loadFixture, deployContract} = waffle;

const WETH9 = require("./artifacts/WETH9");
const NasdexSwapFactory = require("./artifacts/NasdexSwapFactory");
const NasdexSwapRouter = require("./artifacts/NasdexSwapRouter");
const IUniswapPair = require("../artifacts/contracts/interface/IUniswapPair.sol/IUniswapPair");

exports.swapFixture = async function(_wallets, _mockProvider) {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const weth = await deployContract(owner, WETH9);
    let factory = await deployContract(owner, NasdexSwapFactory, [owner.address]);
    let router = await deployContract(owner, NasdexSwapRouter, [factory.address, weth.address]);
    const AssetToken = await ethers.getContractFactory("AssetToken");
    const USDCSample = await ethers.getContractFactory("USDCSample");
    const tokenA = await AssetToken.deploy("test A", "TA");
    tokenA.deployTransaction.wait();
    const tokenB = await USDCSample.deploy("test B", "TB");
    tokenB.deployTransaction.wait();
    await (await tokenA.mint(owner.address, BigNumber.from('1000000000000000000000000000000'))).wait();
    await (await tokenB.mint(owner.address, BigNumber.from('1000000000000000000000000000000'))).wait();
    await (await tokenA.approve(router.address, BigNumber.from('1000000000000000000000000000000'))).wait();
    await (await tokenB.approve(router.address, BigNumber.from('1000000000000000000000000000000'))).wait();
    
    // await sleep(1);

    let amountA;
    let amountB;
    let liquidity;
    await (await router.addLiquidity(
        tokenA.address, 
        tokenB.address, 
        BigNumber.from('100000000000000000000000'), 
        BigNumber.from('100000000000000000000000'), 
        0, 
        0, 
        owner.address, 
        BigNumber.from('1000000000000000000')
    )).wait();
    let pairaddr = await factory.getPair(tokenA.address, tokenB.address);
    let pair = await ethers.getContractAt("IUniswapPair", pairaddr);
    return {weth, factory, router, pair};
}

exports.masterChefFixture = async function(_wallets, _mockProvider) {
    const NSDXToken = require("./artifacts/NSDXToken");
    const MasterChef = require("./artifacts/MasterChef");

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const nsdxToken = await deployContract(owner, NSDXToken);
    await nsdxToken.deployTransaction.wait();
    const masterChef = await deployContract(
        owner, 
        MasterChef, 
        [
            nsdxToken.address,
            BigNumber.from("12000000000000000000"),
            0,
            BigNumber.from("252288000000000000000000000")
        ]
    );
    await masterChef.deployTransaction.wait();
    await (await nsdxToken.transferOwnership(masterChef.address)).wait();
    return { nsdxToken, masterChef };
}

// function sleep(seconds) {
//     return new Promise(resolve => setTimeout(resolve, seconds * 1000));
// }

// export { swapFixture };