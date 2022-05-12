# Nasdex-mint

A DeFi protocol powered by smart contracts on the Polygon Blockchain that enables the creation of synthetic assets called Nasdexed Assets (nAssets).

## Smart contract integration

### Mint nAsset

```JS
mintContract.openPosition(
    assetToken, // nAsset token address
    cAssetToken, // collateral token address
    cAssetAmount, // collateral amount
    cRatio // collateral ratio
)
```

### Long Farm

Long Farm means `openPosition()` in Mint contract + `addLiquidity()` in SwapRouter contract

```JS
swapRouterContract.addLiquidity(
    tokenA,
    tokenB,
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    to,
    deadline
)
```

### Short Farm

```JS
mintContract.openShortPosition(
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
mintContract.deposit(
    positionId, // position id
    cAssetAmount // collateral amount
)
```

### Withdraw collateral from a position

```JS
mintContract.withdraw(
    positionId, // position id
    cAssetAmount // collateral amount
)
```

### Mint more nAsset from an exist position
```JS
mintContract.mint(
    positionId, // position ID
    assetAmount, // nAsset amount
    swapAmountMin, // Min amount you wanna received when sold to a swap if this position is a short position
    swapDeadline // Deadline time when sold to swap
)
```

### Burn nAsset and increase C-Ratio
```JS
mintContract.burn(
    positionId, // position id
    assetAmount // nAsset amount to be burned
)
```

## Contract addresses

| Token Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| NSDX   | [0xE8d17b127BA8b9899a160D9a07b69bCa8E08bfc6](https://polygonscan.com/address/0xE8d17b127BA8b9899a160D9a07b69bCa8E08bfc6) |  [0x620c07ab0d26Fc22E346aadC895bc1eD84C6CF78](https://mumbai.polygonscan.com/address/0x620c07ab0d26Fc22E346aadC895bc1eD84C6CF78) |
| USDC   | [0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174](https://polygonscan.com/address/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174) |  [0x2F059f10b9c8F21eF509f0a00B1A4DC21511CdFf](https://mumbai.polygonscan.com/address/0x2F059f10b9c8F21eF509f0a00B1A4DC21511CdFf) |
| NSDX/USDC   | [0x56B8936a96cD5EE5C5837F385a19B4c2999fD74a](https://polygonscan.com/address/0x56B8936a96cD5EE5C5837F385a19B4c2999fD74a) |  [0xF914dae3144E6f19DdD9143bd0f8ff8Fb016534a](https://mumbai.polygonscan.com/address/0xF914dae3144E6f19DdD9143bd0f8ff8Fb016534a) |
| UST   | [0xE6469Ba6D2fD6130788E0eA9C0a0515900563b59](https://polygonscan.com/address/0xE6469Ba6D2fD6130788E0eA9C0a0515900563b59) |  [0x06b7af58Da1361e528fD663b9f687a0df238Ef63](https://mumbai.polygonscan.com/address/0x06b7af58Da1361e528fD663b9f687a0df238Ef63) |
| aUST   | [0xF28672b9DeA2611a2d22AB78Cb54cE2DD315aEaa](https://polygonscan.com/address/0xF28672b9DeA2611a2d22AB78Cb54cE2DD315aEaa) |  [0xC0b7210Cc4c0E829FfD6d113092887BF1542965B](https://mumbai.polygonscan.com/address/0xC0b7210Cc4c0E829FfD6d113092887BF1542965B) |
| nSE/USDC   | [0x5f1BD282C552446887919E810901b55Bc6dA2ac4](https://polygonscan.com/address/0x5f1BD282C552446887919E810901b55Bc6dA2ac4) |  [0x9d74037228Aa739904086D4EC3b9FcBF2DaD28e1](https://mumbai.polygonscan.com/address/0x9d74037228Aa739904086D4EC3b9FcBF2DaD28e1) |
| nSE   | [0xc7D14a939eE0265BEAB7456394E50Ccc6C665298](https://polygonscan.com/address/0xc7D14a939eE0265BEAB7456394E50Ccc6C665298) |  [0xd99dee10fBA100f0c1c5940A956C890a96bB17b4](https://mumbai.polygonscan.com/address/0xd99dee10fBA100f0c1c5940A956C890a96bB17b4) |
| sSE   | [0xef4c2e11E136e2824d4Ec9bc4b147d8C38d931f5](https://polygonscan.com/address/0xef4c2e11E136e2824d4Ec9bc4b147d8C38d931f5) |  [0x2ABB64610959D097472d3c61ffA851b28288b72c](https://mumbai.polygonscan.com/address/0x2ABB64610959D097472d3c61ffA851b28288b72c) |
| nTSLA/USDC   | [0x8dEf846Af4c574835D6406ceB442eEE57eE1C424](https://polygonscan.com/address/0x8dEf846Af4c574835D6406ceB442eEE57eE1C424) |  [0x66b9A44d9487175177698BCD9812dBdeeA08fb3D](https://mumbai.polygonscan.com/address/0x66b9A44d9487175177698BCD9812dBdeeA08fb3D) |
| nTSLA   | [0xe532dcE6BEFe42Ca8767DFa2abFCE2b99087168B](https://polygonscan.com/address/0xe532dcE6BEFe42Ca8767DFa2abFCE2b99087168B) |  [0xC0837c7933e8e19F615453e978f76c1C72bc8d16](https://mumbai.polygonscan.com/address/0xC0837c7933e8e19F615453e978f76c1C72bc8d16) |
| sTSLA   | [0x12C590aD53CD55677D15B9E2f7D5866B6E1931bB](https://polygonscan.com/address/0x12C590aD53CD55677D15B9E2f7D5866B6E1931bB) |  [0xC2a6701cC948e01375B6042466439F21CaeAe3ac](https://mumbai.polygonscan.com/address/0xC2a6701cC948e01375B6042466439F21CaeAe3ac) |
| nAAPL/USDC   | [0xEA6507115D1194Bfe733bF0053d8Aa8EAc3032a8](https://polygonscan.com/address/0xEA6507115D1194Bfe733bF0053d8Aa8EAc3032a8) |   |
| nAAPL   | [0xb37AFD7c8C0AbAe135Bb144bb6F37E8a3b5796ca](https://polygonscan.com/address/0xb37AFD7c8C0AbAe135Bb144bb6F37E8a3b5796ca) |   |
| sAAPL   | [0xF3F2a9dCd7388Ad8289E7fCe7039Dd5a4068d81b](https://polygonscan.com/address/0xF3F2a9dCd7388Ad8289E7fCe7039Dd5a4068d81b) |   |

| Main Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Mint   | [0xDf6ea9670E3f89555Eec716aADFD3fbf0F8a14FD](https://polygonscan.com/address/0xDf6ea9670E3f89555Eec716aADFD3fbf0F8a14FD) |  [0x3f4b4c27F22F768F6756f0Ab5AC7D8570A94253b](https://mumbai.polygonscan.com/address/0x3f4b4c27F22F768F6756f0Ab5AC7D8570A94253b) |
| SwapRouter   | [0x270Ec6bE0C9D67370C2B247D5AF1CC0B7dED0d4a](https://polygonscan.com/address/0x270Ec6bE0C9D67370C2B247D5AF1CC0B7dED0d4a) |  [0xeF1F06F0a9645A143Eaccb543f5bda85A9BD21D9](https://mumbai.polygonscan.com/address/0xeF1F06F0a9645A143Eaccb543f5bda85A9BD21D9) |
| SwapFactory   | [0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97](https://polygonscan.com/address/0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97) |  [0x03A8C741d36a8bF689A24C1F5d59cc122704E85F](https://mumbai.polygonscan.com/address/0x03A8C741d36a8bF689A24C1F5d59cc122704E85F) |
| MasterChef   | [0x35cA0e02C4c16c94c4cC8B67D13d660b78414f95](https://polygonscan.com/address/0x35cA0e02C4c16c94c4cC8B67D13d660b78414f95) |  [0xFe12AddfCDa0047aE304ADe81cEA6eBEe304a35d](https://mumbai.polygonscan.com/address/0xFe12AddfCDa0047aE304ADe81cEA6eBEe304a35d) |
| Admin   | [0xb88C7a8e678B243a6851b9Fa82a1aA0986574631](https://polygonscan.com/address/0xb88C7a8e678B243a6851b9Fa82a1aA0986574631) |  [0x51B6F9dc5a67fCF62c84E2314651100f8Bc5cF43](https://mumbai.polygonscan.com/address/0x51B6F9dc5a67fCF62c84E2314651100f8Bc5cF43) |
| SwappableLib   | [0x29fEb014B517b33DEd6ED59D3c5d68F4E509b29b](https://polygonscan.com/address/0x29fEb014B517b33DEd6ED59D3c5d68F4E509b29b) |  [0x168c84de27427e7c70818fDae0AA1013fb349619](https://mumbai.polygonscan.com/address/0x168c84de27427e7c70818fDae0AA1013fb349619) |
| Asset   | [0x6C1BAa725A126e9936A2627b7024c3f8c450E64C](https://polygonscan.com/address/0x6C1BAa725A126e9936A2627b7024c3f8c450E64C) |  [0xdb5Bdc9a9f4d5C0b2790F55Ff12f5409c021e990](https://mumbai.polygonscan.com/address/0xdb5Bdc9a9f4d5C0b2790F55Ff12f5409c021e990) |
| Positions   | [0x0Dc84B14964234DCB4465874F9FF4778EBb2998a](https://polygonscan.com/address/0x0Dc84B14964234DCB4465874F9FF4778EBb2998a) |  [0x23099D88645526e9AD00e27f441247824f2A2703](https://mumbai.polygonscan.com/address/0x23099D88645526e9AD00e27f441247824f2A2703) |
| ShortLock   | [0x1D7E96bf705bCeEF2d78286d74e940bDf1072345](https://polygonscan.com/address/0x1D7E96bf705bCeEF2d78286d74e940bDf1072345) |  [0xbEc3621C7336C90FB8BA6a096FDF2beCc5928B06](https://mumbai.polygonscan.com/address/0xbEc3621C7336C90FB8BA6a096FDF2beCc5928B06) |
| ShortStaking   | [0x12531d4ac0669Fa24621C27D0541895b2eB0343d](https://polygonscan.com/address/0x12531d4ac0669Fa24621C27D0541895b2eB0343d) |  [0x2307b6DD2D29e4D8a48bfE759228A202EF67452F](https://mumbai.polygonscan.com/address/0x2307b6DD2D29e4D8a48bfE759228A202EF67452F) |
| LongStaking   | [0x63213eCf311F60c52c6d00C7FE700f2BdCE353Bb](https://polygonscan.com/address/0x63213eCf311F60c52c6d00C7FE700f2BdCE353Bb) |  [0x620f061cd682013863742D4e8B4EFC992aC9807B](https://mumbai.polygonscan.com/address/0x620f061cd682013863742D4e8B4EFC992aC9807B) |
| MultiCall   | [0xA8e39872452BA48b1F4c7e16b78668199d2C41Dd](https://polygonscan.com/address/0xA8e39872452BA48b1F4c7e16b78668199d2C41Dd) |  [0x872808abd468F80c80213f48a5E917b5F5c371f8](https://mumbai.polygonscan.com/address/0x872808abd468F80c80213f48a5E917b5F5c371f8) |
| Liquidation   | [0x5d5E3318421D3C38E5fa415c8A55e2f16caef385](https://polygonscan.com/address/0x5d5E3318421D3C38E5fa415c8A55e2f16caef385) |  [](https://mumbai.polygonscan.com/address/) |

| Oracle Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| nSE Oracle   | [0xcc73e00db7a6FD589a30BbE2E957086b8d7D3331](https://polygonscan.com/address/0xcc73e00db7a6FD589a30BbE2E957086b8d7D3331) |  [0xEEeEB911f1c30217EfFC662B157f8BAF91f1133b](https://mumbai.polygonscan.com/address/0xEEeEB911f1c30217EfFC662B157f8BAF91f1133b) |
| nTSLA Oracle   | [0x567E67f456c7453c583B6eFA6F18452cDee1F5a8](https://polygonscan.com/address/0x567E67f456c7453c583B6eFA6F18452cDee1F5a8) |  [0xDb12E805d004698FC58F6e4fbdD876268DF2dfFe](https://mumbai.polygonscan.com/address/0xDb12E805d004698FC58F6e4fbdD876268DF2dfFe) |
| aUST Oracle   | [0x7958b7693bE15a601cFef8e091c69f18d738e4E8](https://polygonscan.com/address/0x7958b7693bE15a601cFef8e091c69f18d738e4E8) |  [0xC6Be21D8533e90Fd136905eBe70c9d9148237f2d](https://mumbai.polygonscan.com/address/0xC6Be21D8533e90Fd136905eBe70c9d9148237f2d) |
