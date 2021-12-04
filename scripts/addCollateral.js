const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const ADMIN_ADDR = "0x93D8Ddd2383Ace11397bcab11fDbc40c8420279d";
const USDT_ADDR = "0x519130DA1C46CF79F39A0339016c07c77f938fCB";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Register a nAsset in Asset contract."
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Admin = await ethers.getContractFactory("Admin");
    const _admin = await Admin.attach(ADMIN_ADDR);

    const transaction = await _admin.asset_registerCollateral(USDT_ADDR, ethers.constants.AddressZero, 1);
    console.log("add collateral: " + transaction.hash);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});