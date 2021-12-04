const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Admin contract", function() {
    let Mint;
    let assetInstance;
    let positionsInstance;
    let mintInstance;
    let shortStaking;
    let longStaking;
    let shortLock;
    let masterChef;

    let owner;
    let addr1;
    
    let usdtToken;
    
    let adminInstance;

    // 0.2%
    const FEE_RATE = 2;

    const START_BLOCK = 10000;
    const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
    const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.


    before(async function() {
        const Asset = await ethers.getContractFactory("Asset");
        const Positions = await ethers.getContractFactory("Positions");
        const Swappable = await ethers.getContractFactory("Swappable");
        const libSwappable = await Swappable.deploy();
        Mint = await ethers.getContractFactory(
            "Mint",
            {
                libraries: {
                    Swappable: libSwappable.address,
                },
            }
        );
        const AssetToken = await ethers.getContractFactory("AssetToken");
        // const OracleSample = await ethers.getContractFactory("OracleSample");
        const ShortLock = await ethers.getContractFactory("ShortLock");
        const ShortStaking = await ethers.getContractFactory("ShortStaking");
        const LongStaking = await ethers.getContractFactory("LongStaking");
        const MasterChef = await ethers.getContractFactory("MasterChef");
        const Admin = await ethers.getContractFactory("Admin");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // deploy Admin contract.
        adminInstance = await Admin.deploy(
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero
        );

        assetInstance = await Asset.deploy();
        positionsInstance = await Positions.deploy();

        // nTokenA = await AssetToken.deploy(TOKEN_NAME_A, TOKEN_SYMBOL_A);
        usdtToken = await AssetToken.deploy("TetherUSD", "USDT");
        // oracleSample = await OracleSample.deploy(BigNumber.from('3500000000'), 8);

        // ShortLock
        shortLock = await ShortLock.deploy(
            ethers.constants.AddressZero,  // TODO wrong address
            BigNumber.from('10000000')
        );

        // MasterChef for test net
        const nsdxToken = await AssetToken.deploy("Nasdex", "NSDX");
        masterChef = await MasterChef.deploy(
            nsdxToken.address, 
            REWARD_PER_BLOCK, 
            START_BLOCK, 
            NSDX_MAX_MINT
        );

        // ShortStaking
        shortStaking = await ShortStaking.deploy(
            nsdxToken.address, 
            START_BLOCK + 100, 
            masterChef.address, 
            ethers.constants.AddressZero // TODO wrong address
        );
        
        // LongStaking
        longStaking = await LongStaking.deploy(
            nsdxToken.address, 
            START_BLOCK + 100, 
            masterChef.address, 
            ethers.constants.AddressZero // TODO wrong address
        );

        // Mint
        mintInstance = await Mint.deploy(
            FEE_RATE, 
            assetInstance.address,
            positionsInstance.address,
            usdtToken.address, 
            shortLock.address,
            shortStaking.address,
            "0x0000000000000000000000000000000000000001", // TODO wrong address
            ethers.constants.AddressZero // TODO wrong address
        );

        await adminInstance.setShortStaking(shortStaking.address);
        await adminInstance.setLongStaking(longStaking.address);
        await adminInstance.setShortLock(shortLock.address);
        await adminInstance.setAsset(assetInstance.address);
        await adminInstance.setMint(mintInstance.address);
        await adminInstance.setMasterChef(masterChef.address);

        await shortStaking.transferOwnership(adminInstance.address);
        await longStaking.transferOwnership(adminInstance.address);
        await shortLock.transferOwnership(adminInstance.address);
        await assetInstance.transferOwnership(adminInstance.address);
        await mintInstance.transferOwnership(adminInstance.address);
        await masterChef.transferOwnership(adminInstance.address);
    });

    beforeEach(async function() {
        // console.log("beforeEach");
    });

    afterEach(async function() {
        
    });

    after(async function() {

    });

    describe("Ownership", function() {
        it("Should set the right owner", async function () {
            expect(await adminInstance.owner()).to.equal(owner.address);
        });
      
        it("Should can be transfer to another", async function () {
            await adminInstance.transferOwnership(addr1.address);
            expect(await adminInstance.owner()).to.equal(addr1.address);
            await adminInstance.connect(addr1).transferOwnership(owner.address);
            expect(await adminInstance.owner()).to.equal(owner.address);
        });
    });

    describe("Subcontract's ownership", function() {
        it("Should be the owner of every subcontract", async function() {
            expect(await shortStaking.owner()).to.equal(adminInstance.address);
            expect(await shortLock.owner()).to.equal(adminInstance.address);
            expect(await assetInstance.owner()).to.equal(adminInstance.address);
            expect(await mintInstance.owner()).to.equal(adminInstance.address);
            expect(await masterChef.owner()).to.equal(adminInstance.address);
        });

        it("Could transfer subcontract's owner", async function() {
            await adminInstance.transferAllOwnership(addr1.address);
            expect(await shortStaking.owner()).to.equal(addr1.address);
            expect(await shortLock.owner()).to.equal(addr1.address);
            expect(await assetInstance.owner()).to.equal(addr1.address);
            expect(await mintInstance.owner()).to.equal(addr1.address);
            expect(await masterChef.owner()).to.equal(addr1.address);
        })
    })
});