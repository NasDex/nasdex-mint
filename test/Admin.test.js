const { BigNumber } = require("@ethersproject/bignumber");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@ethereum-waffle/provider");
const { swapFixture } = require("./Fixtures");
const {deployMockContract} = require('@ethereum-waffle/mock-contract');

const IChainlinkAggregator = require("../artifacts/contracts/interface/IChainlinkAggregator.sol/IChainlinkAggregator");

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
    
    let usdcToken;
    
    let adminInstance;

    let mockOracle;

    // 0.2%
    const FEE_RATE = 2;

    const START_BLOCK = 10000;
    const REWARD_PER_BLOCK = BigNumber.from('100000000000000000000'); // 100
    const NSDX_MAX_MINT = BigNumber.from('100000000000000000000000000'); // 0.1 billion.


    const TOKEN_NAME_A = "Stock-A";
    const TOKEN_SYMBOL_A = "nSTA";
    const SHORT_TOKEN_NAME_A = "Short Stock-A";
    const SHORT_TOKEN_SYMBOL_A = "sSTA";
    const DISCOUNT = 800;
    const MIN_CRATIO = 1500; // 1500 / 1000 = 150%
    const TARGET_RATIO = 1800; // 180%


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

        // swap
        const { weth, factory, router, pair } = await loadFixture(swapFixture);

        // deploy Admin contract.
        adminInstance = await Admin.deploy(
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            factory.address
        );

        assetInstance = await Asset.deploy();
        positionsInstance = await Positions.deploy();

        // nTokenA = await AssetToken.deploy(TOKEN_NAME_A, TOKEN_SYMBOL_A);
        usdcToken = await AssetToken.deploy("USD Coin", "USDC");
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
            router.address
        );

        // Mint
        mintInstance = await Mint.deploy(
            FEE_RATE, 
            assetInstance.address,
            positionsInstance.address,
            usdcToken.address, 
            shortLock.address,
            shortStaking.address,
            router.address,
            weth.address, 
            owner.address
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

        // oracle
        mockOracle = await deployMockContract(owner, IChainlinkAggregator.abi);
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
        });

        it("Could transfer back", async function() {
            await shortStaking.connect(addr1).transferOwnership(adminInstance.address);
            await longStaking.connect(addr1).transferOwnership(adminInstance.address);
            await shortLock.connect(addr1).transferOwnership(adminInstance.address);
            await assetInstance.connect(addr1).transferOwnership(adminInstance.address);
            await mintInstance.connect(addr1).transferOwnership(adminInstance.address);
            await masterChef.connect(addr1).transferOwnership(adminInstance.address);

            expect(await shortStaking.owner()).to.equal(adminInstance.address);
            expect(await shortLock.owner()).to.equal(adminInstance.address);
            expect(await assetInstance.owner()).to.equal(adminInstance.address);
            expect(await mintInstance.owner()).to.equal(adminInstance.address);
            expect(await masterChef.owner()).to.equal(adminInstance.address);
        });
    });

    describe("Whitelist", function() {
        it("Could whitelist a new nAsset", async function() {

            let blockNumber = await ethers.provider.getBlockNumber();
            let block = await ethers.provider.getBlock(blockNumber);
            await mockOracle.mock.latestRoundData.returns(0, 3500000000, block.timestamp, 0, 0);

            let tokenParams = {
                nTokenName: TOKEN_NAME_A, 
                nTokenSymbol: TOKEN_SYMBOL_A, 
                sTokenName: SHORT_TOKEN_NAME_A, 
                sTokenSymbol: SHORT_TOKEN_SYMBOL_A, 
            };
        
            let whiteListParams = {
                oracle: mockOracle.address, 
                auctionDiscount: DISCOUNT, 
                minCRatio: MIN_CRATIO, 
                targetRatio: TARGET_RATIO, 
                isInPreIPO: false
            }
        
            let trans = await adminInstance.whiteList(
                tokenParams, 
                1000, 
                1000, 
                whiteListParams,
                {mintEnd:1000000, preIPOPrice:3000000, minCRatioAfterIPO:1500}
            );
        
            await trans.wait();
        });
    });
});