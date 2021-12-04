require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-solhint");
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
// require('hardhat-deploy');
const fs = require('fs');

const accounts = {
  mnemonic: fs.readFileSync(".secret").toString().trim(),
  // path: "m/44'/60'/0'/0",
  // initialIndex: 0,
  // count: 20
}

module.exports = {
  // defaultNetwork: "rinkeby",
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
      // gasPrice: "auto",
      // gasMultiplier: 1,
      // timeout: 20000
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts,
      chainId: 137,
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
    runOnCompile: true,
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
