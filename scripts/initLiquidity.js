const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const USDC_ADDR = "0x5E76EA44D394025126Fa3BDf30F7EBAbb1E27E35";
let NTOKEN_ADDR = "";

const SWAP_ROUTER = "0x60065e6B6d53aAd28C381FD9a4aa2ec839852e91";
const MINT_ADDR = "0xEb430740b89193272D10Cf3c048f9091aC7843a7";

const LIB_SWAPPABLE_ADDR = "0x599D42b192c86E94483f1fD45F69F31B552EF403";

let price;

const readline = require('readline-sync');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Initialize liquidity."
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    NTOKEN_ADDR = readline.question("Which token do you want to add liquidity? Input the nToken address: ").trim();

    let Mint = await ethers.getContractFactory(
        "Mint",
        {
            libraries: {
                Swappable: LIB_SWAPPABLE_ADDR,
            },
        }
    );
    let _mint = await Mint.attach(MINT_ADDR);

    let usdcToken = await ethers.getContractAt("IAssetToken", USDC_ADDR);
    let nToken = await ethers.getContractAt("IAssetToken", NTOKEN_ADDR);

    let usdcSymbol = await usdcToken.symbol();
    let nTokenSymbol = await nToken.symbol();

    price = readline.question("What is the price of " + nTokenSymbol + " in " + usdcSymbol + "? (number, used in adding liquidity): ");
    price = parseInt(price);

    await (await usdcToken.approve(MINT_ADDR, BigNumber.from("1000000000000000000000000000000"))).wait();
    await (await usdcToken.approve(SWAP_ROUTER, BigNumber.from("1000000000000000000000000000000"))).wait();
    await (await nToken.approve(MINT_ADDR, BigNumber.from("1000000000000000000000000000000"))).wait();
    await (await nToken.approve(SWAP_ROUTER, BigNumber.from("1000000000000000000000000000000"))).wait();

    let usdcDecimals = BigNumber.from(10).pow(await usdcToken.decimals());
    let nTokenDecimals = BigNumber.from(10).pow(await nToken.decimals());

    console.log("approved.");

    let transaction = await _mint.openPosition(
        NTOKEN_ADDR,
        USDC_ADDR,
        BigNumber.from('50000000').mul(usdcDecimals), // 50000000
        2000,
        {gasLimit: 7500000}
    );
    await transaction.wait();
    console.log("Open position: " + transaction.hash);
    
    // console.log("Start to sleep 5s ....");
    // await sleep(5);
    // console.log("Sleep end ....");

    let myNTokenBalance = await nToken.balanceOf(deployer.address);
    let myUSDCBalance = await usdcToken.balanceOf(deployer.address);
    console.log("nSTA balance: " + myNTokenBalance.toString());
    console.log("USDC balance: " + myUSDCBalance.toString());

    let usdcToAdd = myNTokenBalance.div(nTokenDecimals).mul(price).mul(usdcDecimals);
    console.log("nSTA to add: " + myNTokenBalance.toString());
    console.log("USDC to add: " + usdcToAdd.toString());

    let _router = await ethers.getContractAt("IUniswapV2Router", SWAP_ROUTER);
    console.log("Router: " + _router.address);

    let transaction1 = await _router.addLiquidity(
        NTOKEN_ADDR,
        USDC_ADDR,
        myNTokenBalance,
        usdcToAdd,
        0,
        0,
        deployer.address,
        BigNumber.from('10000000000000000000000')
    );
    await transaction1.wait();
    console.log("Add liquidity: " + transaction1.hash);

    // console.log("Start to sleep 5s ....");
    // await sleep(5);
    // console.log("Sleep end ....");

    let transaction2 = await _mint.openShortPosition(
        NTOKEN_ADDR,
        USDC_ADDR,
        BigNumber.from('800').mul(usdcDecimals),
        2000,
        0,
        BigNumber.from('10000000000000000000')
    );
    await transaction2.wait();
    console.log("Open short position: " + transaction2.hash);
}

// function sleep(seconds) {
//     return new Promise(resolve => setTimeout(resolve, seconds * 1000));
// }

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});