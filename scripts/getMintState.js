const { ethers } = require("hardhat")


const MINT_ADDR = "0xDf6ea9670E3f89555Eec716aADFD3fbf0F8a14FD"

async function main() {
    const mintC = await ethers.getContractFactory("Mint", {
        libraries: {
            Swappable: "0x29fEb014B517b33DEd6ED59D3c5d68F4E509b29b"
        },
    })
    const mint = await mintC.attach(MINT_ADDR)

    const asset = await mint.asset()
    const positions = await mint.positions()
    const feeRate = await mint.feeRate()
    const swapToToken = await mint.swapToToken()
    const maxDelay = await mint.oracleMaxDelay()
    const lock = await mint.lock()
    const staking = await mint.staking()
    const feeTo = await mint.feeTo()

    console.log("asset       :", asset)
    console.log("positions   :", positions)
    console.log("feeRate     :", feeRate)
    console.log("swapToToken :", swapToToken)
    console.log("maxDelay    :", maxDelay.toString())
    console.log("lock        :", lock)
    console.log("staking     :", staking)
    console.log("feeTo       :", feeTo)
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});