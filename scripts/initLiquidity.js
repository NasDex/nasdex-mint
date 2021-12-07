const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const USDT_ADDR = "0x519130DA1C46CF79F39A0339016c07c77f938fCB";
const NTOKEN_ADDR = "0x2e19De127f01927B6b5Eb5Cdd304F1C5A75A4f05";

const SWAP_ROUTER = "0x60065e6B6d53aAd28C381FD9a4aa2ec839852e91";
const MINT_ADDR = "0xC55e37de141f13A492c172E7A6d8275fDEA2966D";

const LIB_SWAPPABLE_ADDR = "0xf44D2CE858C5972208bb9e96350a25c3fB9C32Aa";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Initialize liquidity."
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    let Mint = await ethers.getContractFactory(
        "Mint",
        {
            libraries: {
                Swappable: LIB_SWAPPABLE_ADDR,
            },
        }
    );
    let _mint = await Mint.attach(MINT_ADDR);

    let usdtToken = await ethers.getContractAt("IAssetToken", USDT_ADDR);
    let nToken = await ethers.getContractAt("IAssetToken", NTOKEN_ADDR);

    await usdtToken.approve(MINT_ADDR, BigNumber.from("1000000000000000000000000000"));
    await usdtToken.approve(SWAP_ROUTER, BigNumber.from("1000000000000000000000000000"));
    await nToken.approve(MINT_ADDR, BigNumber.from("1000000000000000000000000000"));
    await nToken.approve(SWAP_ROUTER, BigNumber.from("1000000000000000000000000000"));

    console.log("approved.");

    let transaction = await _mint.openPosition(
        NTOKEN_ADDR,
        USDT_ADDR,
        BigNumber.from('50000000000000000000000000'), // 50000000
        2000
    );
    console.log("Open position: " + transaction.hash);
    
    console.log("Start to sleep 5s ....");
    await sleep(5);
    console.log("Sleep end ....");

    let myNTokenBalance = await nToken.balanceOf(deployer.address);

    let _router = await ethers.getContractAt("IUniswapV2Router", SWAP_ROUTER);
    console.log("Router: " + _router.address);

    let transaction1 = await _router.addLiquidity(
        NTOKEN_ADDR,
        USDT_ADDR,
        myNTokenBalance,
        myNTokenBalance.mul(35),
        0,
        0,
        deployer.address,
        BigNumber.from('10000000000000000000000')
    );
    console.log("Add liquidity: " + transaction1.hash);

    console.log("Start to sleep 5s ....");
    await sleep(5);
    console.log("Sleep end ....");

    let transaction2 = await _mint.openShortPosition(
        NTOKEN_ADDR,
        USDT_ADDR,
        BigNumber.from('800000000000000000000'),
        2000,
        0,
        BigNumber.from('10000000000000000000')
    );
    console.log("Open short position: " + transaction2.hash);
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});