const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Positions contract", function() {
    
    let positionsInstance;

    let owner;
    let addr1;

    before(async function() {
        const Positions = await ethers.getContractFactory("Positions");

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        positionsInstance = await Positions.deploy();
    });

    beforeEach(async function() {

    });

    afterEach(async function() {

    });

    after(async function() {

    });

    describe("Ownership", function() {
        it("Should set the right owner", async function () {
            expect(await positionsInstance.owner()).to.equal(owner.address);
        });
      
        it("Should can be transfer to another", async function () {
            await positionsInstance.transferOwnership(addr1.address);
            expect(await positionsInstance.owner()).to.equal(addr1.address);
            await positionsInstance.connect(addr1).transferOwnership(owner.address);
            expect(await positionsInstance.owner()).to.equal(owner.address);
        });
    });

    describe("openPostion", function() {
        it("Should emit event", async function() {
            expect(
                await positionsInstance.openPosition(
                    owner.address, 
                    ethers.constants.AddressZero,
                    0,
                    ethers.constants.AddressZero,
                    0,
                    true
                )
            )
            .to
            .emit(positionsInstance, "OpenPosition")
            .withArgs(1);
        });
    });
});