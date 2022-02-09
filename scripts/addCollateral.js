const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const ADMIN_ADDR = "0xC01bd61922702D06fA0EA91D2672AEba4Cd7E6d3";
const COLLATERAL_ADDR = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Register a nAsset in Asset contract."
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Admin = await ethers.getContractFactory("Admin");
    const _admin = await Admin.attach(ADMIN_ADDR);

    const transaction = await _admin.asset_registerCollateral(COLLATERAL_ADDR, ethers.constants.AddressZero, 2);
    await transaction.wait();
    console.log("add collateral: " + transaction.hash);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});