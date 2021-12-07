const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const env = require("hardhat");
const { ethers } = require("hardhat");

const SWAP_FACTORY = "0x60065e6B6d53aAd28C381FD9a4aa2ec839852e91";

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

    console.log("Admin address: " + adminInstance.address);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});