# Nasdex-mint

A DeFi protocol powered by smart contracts on the Polygon Blockchain that enables the creation of synthetic assets called Nasdexed Assets (nAssets).

## Smart contract integration

### Mint nAsset

```JS
contract.openPosition(
    assetToken, // nAsset token address
    cAssetToken, // collateral token address
    cAssetAmount, // collateral amount
    cRatio // collateral ratio
)
```

### Long Farm

Long Farm means `openPosition()` in Mint contract + `addLiquidity()` in SwapRouter contract

### Short Farm

```JS
contract.openShortPosition(
    assetToken, // nAsset token address
    cAssetToken, // collateral token address
    cAssetAmount, // collateral amount
    cRatio, // collateral ratio
    swapAmountMin, // The minimum expected value during swap.
    swapDeadline // When selling n assets, the deadline for the execution of this transaction
)
```

### Deposit collateral and increase C-Ratio

```JS
contract.deposit(
    positionId, // position id
    cAssetAmount // collateral amount
)
```

### Withdraw collateral from a position

```JS
contract.withdraw(
    positionId, // position id
    cAssetAmount // collateral amount
)
```

### Mint more nAsset from an exist position
```JS
contract.mint(
    positionId, // position ID
    assetAmount, // nAsset amount
    swapAmountMin, // Min amount you wanna received when sold to a swap if this position is a short position
    swapDeadline // Deadline time when sold to swap
)
```

### Burn nAsset and increase C-Ratio
```JS
contract.burn(
    positionId, // position id
    assetAmount // nAsset amount to be burned
)
```

## Contract addresses

| Token Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| NSDX   | [0xE8d17b127BA8b9899a160D9a07b69bCa8E08bfc6](https://polygonscan.com/address/0xE8d17b127BA8b9899a160D9a07b69bCa8E08bfc6) |  [0x0b0E5B52e14152308f9F952FF19C67ebeB7560BB](https://mumbai.polygonscan.com/address/0x0b0E5B52e14152308f9F952FF19C67ebeB7560BB) |
| USDC   | [0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174](https://polygonscan.com/address/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174) |  [0xe4E1ec160dFb25eF68C0c158F436C6B8A219C112](https://mumbai.polygonscan.com/address/0xe4E1ec160dFb25eF68C0c158F436C6B8A219C112) |
| UST   | [0xE6469Ba6D2fD6130788E0eA9C0a0515900563b59](https://polygonscan.com/address/0xE6469Ba6D2fD6130788E0eA9C0a0515900563b59) |  [](https://mumbai.polygonscan.com/address/) |
| aUST   | [0xF28672b9DeA2611a2d22AB78Cb54cE2DD315aEaa](https://polygonscan.com/address/0xF28672b9DeA2611a2d22AB78Cb54cE2DD315aEaa) |  [](https://mumbai.polygonscan.com/address/) |
| nSE/USDC   | [0x5f1BD282C552446887919E810901b55Bc6dA2ac4](https://polygonscan.com/address/0x5f1BD282C552446887919E810901b55Bc6dA2ac4) |  [](https://mumbai.polygonscan.com/address/) |
| nSE   | [0xc7D14a939eE0265BEAB7456394E50Ccc6C665298](https://polygonscan.com/address/0xc7D14a939eE0265BEAB7456394E50Ccc6C665298) |  [](https://mumbai.polygonscan.com/address/) |
| sSE   | [0xef4c2e11E136e2824d4Ec9bc4b147d8C38d931f5](https://polygonscan.com/address/0xef4c2e11E136e2824d4Ec9bc4b147d8C38d931f5) |  [](https://mumbai.polygonscan.com/address/) |
| nTSLA/USDC   | [](https://polygonscan.com/address/) |  [](https://mumbai.polygonscan.com/address/) |
| nTSLA   | [0xe532dcE6BEFe42Ca8767DFa2abFCE2b99087168B](https://polygonscan.com/address/0xe532dcE6BEFe42Ca8767DFa2abFCE2b99087168B) |  [](https://mumbai.polygonscan.com/address/) |
| sTSLA   | [0x12C590aD53CD55677D15B9E2f7D5866B6E1931bB](https://polygonscan.com/address/0x12C590aD53CD55677D15B9E2f7D5866B6E1931bB) |  [](https://mumbai.polygonscan.com/address/) |

| Main Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Mint   | [0xDf6ea9670E3f89555Eec716aADFD3fbf0F8a14FD](https://polygonscan.com/address/0xDf6ea9670E3f89555Eec716aADFD3fbf0F8a14FD) |  [0xDF9fC6774937bf42602be1F80aB3da8a0b2a8594](https://mumbai.polygonscan.com/address/0xDF9fC6774937bf42602be1F80aB3da8a0b2a8594) |
| SwapRouter   | [0x270Ec6bE0C9D67370C2B247D5AF1CC0B7dED0d4a](https://polygonscan.com/address/0x270Ec6bE0C9D67370C2B247D5AF1CC0B7dED0d4a) |  [0xeF1F06F0a9645A143Eaccb543f5bda85A9BD21D9](https://mumbai.polygonscan.com/address/0xeF1F06F0a9645A143Eaccb543f5bda85A9BD21D9) |
| SwapFactory   | [0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97](https://polygonscan.com/address/0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97) |  [0x03A8C741d36a8bF689A24C1F5d59cc122704E85F](https://mumbai.polygonscan.com/address/0x03A8C741d36a8bF689A24C1F5d59cc122704E85F) |
| MasterChef   | [0x35cA0e02C4c16c94c4cC8B67D13d660b78414f95](https://polygonscan.com/address/0x35cA0e02C4c16c94c4cC8B67D13d660b78414f95) |  [0xCc2436221cC9C804c81A6A79aFA7D4aE68946c1b](https://mumbai.polygonscan.com/address/0xCc2436221cC9C804c81A6A79aFA7D4aE68946c1b) |
| Admin   | [0xC01bd61922702D06fA0EA91D2672AEba4Cd7E6d3](https://polygonscan.com/address/0xC01bd61922702D06fA0EA91D2672AEba4Cd7E6d3) |  [0xA77fAaEE48b8DF3a212A3630CE200C5BFA3Ad2d6](https://mumbai.polygonscan.com/address/0xA77fAaEE48b8DF3a212A3630CE200C5BFA3Ad2d6) |
| SwappableLib   | [0x29fEb014B517b33DEd6ED59D3c5d68F4E509b29b](https://polygonscan.com/address/0x29fEb014B517b33DEd6ED59D3c5d68F4E509b29b) |  [](https://mumbai.polygonscan.com/address/) |
| Asset   | [0x6C1BAa725A126e9936A2627b7024c3f8c450E64C](https://polygonscan.com/address/0x6C1BAa725A126e9936A2627b7024c3f8c450E64C) |  [0x57F959245aE35e38d30a8AEc91Ab680C87072587](https://mumbai.polygonscan.com/address/0x57F959245aE35e38d30a8AEc91Ab680C87072587) |
| Positions   | [0x0Dc84B14964234DCB4465874F9FF4778EBb2998a](https://polygonscan.com/address/0x0Dc84B14964234DCB4465874F9FF4778EBb2998a) |  [0xF8b28bAbbAFF14e1357f33ed7D167D36375692cD](https://mumbai.polygonscan.com/address/0xF8b28bAbbAFF14e1357f33ed7D167D36375692cD) |
| ShortLock   | [0x1D7E96bf705bCeEF2d78286d74e940bDf1072345](https://polygonscan.com/address/0x1D7E96bf705bCeEF2d78286d74e940bDf1072345) |  [0x4DDcE09423397De69c4249868252506d9E08b0E0](https://mumbai.polygonscan.com/address/0x4DDcE09423397De69c4249868252506d9E08b0E0) |
| ShortStaking   | [0x12531d4ac0669Fa24621C27D0541895b2eB0343d](https://polygonscan.com/address/0x12531d4ac0669Fa24621C27D0541895b2eB0343d) |  [0xfb99126453e15871fBCdbE8a206598F6818b4843](https://mumbai.polygonscan.com/address/0xfb99126453e15871fBCdbE8a206598F6818b4843) |
| LongStaking   | [0x63213eCf311F60c52c6d00C7FE700f2BdCE353Bb](https://polygonscan.com/address/0x63213eCf311F60c52c6d00C7FE700f2BdCE353Bb) |  [0x96Dd2Ff469A9405a584C08B112c0AD9C1fab862A](https://mumbai.polygonscan.com/address/0x96Dd2Ff469A9405a584C08B112c0AD9C1fab862A) |
| MultiCall   | [0x8F80B3E90787fdaca1eC438db5c50ECfeB49c8b5](https://polygonscan.com/address/0x8F80B3E90787fdaca1eC438db5c50ECfeB49c8b5) |  [0x2f4FA73dd91EB65642053846725EcD0fD09B1d63](https://mumbai.polygonscan.com/address/0x2f4FA73dd91EB65642053846725EcD0fD09B1d63) |
| Liquidation   | [0x5d5E3318421D3C38E5fa415c8A55e2f16caef385](https://polygonscan.com/address/0x5d5E3318421D3C38E5fa415c8A55e2f16caef385) |  [](https://mumbai.polygonscan.com/address/) |

| Oracle Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| nSE Oracle   | [0xcc73e00db7a6FD589a30BbE2E957086b8d7D3331](https://polygonscan.com/address/0xcc73e00db7a6FD589a30BbE2E957086b8d7D3331) |  [](https://mumbai.polygonscan.com/address/) |
| nTSLA Oracle   | [](https://polygonscan.com/address/) |  [](https://mumbai.polygonscan.com/address/) |
