require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-solhint");
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
require('hardhat-deploy');
require("hardhat-deploy-ethers")
const fs = require('fs');

const accounts = {
    mnemonic: fs.readFileSync(".secret").toString().trim(),
}

const deployer = fs.readFileSync("../.private").toString().trim()

module.exports = {
    // defaultNetwork: "rinkeby",
    namedAccounts: {
        deployer: {
            default: 0
        }
    },
    networks: {
        hardhat: {
            accounts
        },
        mumbai: {
            // url: "https://rpc-mumbai.maticvigil.com",
            url: "https://matic-mumbai.chainstacklabs.com",
            accounts,
            chainId: 80001,
            // from:
            // gas: "auto",
            gasPrice: 40000000000,
            // gasMultiplier: 1,
            timeout: 20000
        },
        polygon: {
            url: "https://polygon-rpc.com",
            accounts: [deployer],
            chainId: 137,
            // from:
            // gas: "auto",
            // gasPrice: "auto",
            // gasMultiplier: 1,
            // timeout: 20000
        },
        matic: {
            url: "https://rpc-mainnet.maticvigil.com/v1/f0cfbf50517b3d9ed7326589f8a4ad8b67bd01d2",
            accounts: [deployer],
            chainId: 137,
            // from:
            // gas: "auto",
            // gasPrice: "auto",
            // gasMultiplier: 1,
            // timeout: 20000
        },
        bsctest: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            accounts,
            chainId: 97,
            // from:
            // gas: "auto",
            // gasPrice: "auto",
            // gasMultiplier: 1,
            // timeout: 20000
        }
    },
    solidity: {
        version: "0.8.2",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    etherscan: {
        apiKey: "21I6GMVNVWXG485YRTUDVIQIZ544RD73BB"//process.env.ETHERSCAN_API_KEY
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: false,
        strict: true,
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 20000
    }
}
