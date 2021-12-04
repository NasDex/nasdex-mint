const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShortLock contract", function() {

    let owner;
    let addr1;
    let shortLock;
    let usdtToken;

    before(async function() {
        const ShortLock = await ethers.getContractFactory("ShortLock");
        const AssetToken = await ethers.getContractFactory("AssetToken");

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        shortLock = await ShortLock.deploy(
            addr1.address,  // wrong address
            BigNumber.from('10000000')
        );

        usdtToken = await AssetToken.deploy("TetherUSD", "USDT");
        await usdtToken.mint(addr1.address, BigNumber.from('1000000000000000000000000'));
        let myBalance = await usdtToken.balanceOf(addr1.address);
        await usdtToken.connect(addr1).approve(shortLock.address, myBalance);
    });

    beforeEach(async function() {

    });

    afterEach(async function() {

    });

    after(async function() {

    });

    describe("Ownership", function() {
        it("Should set the right owner", async function () {
            expect(await shortLock.owner()).to.equal(owner.address);
        });
      
        it("Should can be transfer to another", async function () {
            await shortLock.transferOwnership(addr1.address);
            expect(await shortLock.owner()).to.equal(addr1.address);
            await shortLock.connect(addr1).transferOwnership(owner.address);
            expect(await shortLock.owner()).to.equal(owner.address);
        });
    });

    describe("lock", function() {
        it("Should transfer tokens", async function() {
            expect(
                await shortLock.connect(addr1).lock(
                    0, 
                    owner.address,
                    usdtToken.address,
                    BigNumber.from("32100000000000000000") // 321
                )
            )
            .to
            .emit(usdtToken, "Transfer")
            .withArgs(addr1.address, shortLock.address, BigNumber.from("32100000000000000000"));
        });

        it("Should change token balance", async function() {
            expect(await usdtToken.balanceOf(shortLock.address))
            .to
            .equal(BigNumber.from("32100000000000000000"));
        });
    });
});