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
    const tokenA = await AssetToken.deploy("test A", "TA");
    const tokenB = await AssetToken.deploy("test B", "TB");
    tokenA.mint(owner.address, BigNumber.from('1000000000000000000000000000000'));
    tokenB.mint(owner.address, BigNumber.from('1000000000000000000000000000000'));
    tokenA.approve(router.address, BigNumber.from('1000000000000000000000000000000'));
    tokenB.approve(router.address, BigNumber.from('1000000000000000000000000000000'));
    
    await sleep(1);

    let amountA;
    let amountB;
    let liquidity;
    await router.addLiquidity(
        tokenA.address, 
        tokenB.address, 
        BigNumber.from('100000000000000000000000'), 
        BigNumber.from('100000000000000000000000'), 
        0, 
        0, 
        owner.address, 
        BigNumber.from('1000000000000000000')
    );
    let pairaddr = await factory.getPair(tokenA.address, tokenB.address);
    let pair = await ethers.getContractAt("IUniswapPair", pairaddr);
    return {weth, factory, router, pair};
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// export { swapFixture };