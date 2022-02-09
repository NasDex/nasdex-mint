const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const env = require("hardhat");
const { ethers } = require("hardhat");

const SWAP_FACTORY = "0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97";

async function main() {
    [deployer] = await ethers.getSigners();
    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Admin = await ethers.getContractFactory("Admin");
    const adminInstance = await Admin.deploy(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        SWAP_FACTORY
    );

    console.log("Admin address1: " + adminInstance.address);
    console.log("deploy transaction: " + adminInstance.deployTransaction.hash);
    console.log("deploy nonce: " + adminInstance.deployTransaction.nonce);

    await adminInstance.deployTransaction.wait();
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});