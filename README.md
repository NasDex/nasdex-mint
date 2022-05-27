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
| nSE/USDC   | [0x239363FeD0937613A5Ae8b9916754b6b277B553E](https://polygonscan.com/address/0x239363FeD0937613A5Ae8b9916754b6b277B553E) |  [0x6CF79D9c5576dfAC54c6170D404D9569d896b0e4](https://mumbai.polygonscan.com/address/0x6CF79D9c5576dfAC54c6170D404D9569d896b0e4) |
| nSE   | [0xd067082D2808C6Bad647FD497D45c5d1d299216C](https://polygonscan.com/address/0xd067082D2808C6Bad647FD497D45c5d1d299216C) |  [0xc67B287F2F0A0b3589D1C2Fcce4B16C2c8DBDEdc](https://mumbai.polygonscan.com/address/0xc67B287F2F0A0b3589D1C2Fcce4B16C2c8DBDEdc) |
| sSE   | [0xF7A9ff1c816562628Cf38E7F2421e17a4882d901](https://polygonscan.com/address/0xF7A9ff1c816562628Cf38E7F2421e17a4882d901) |  [0x8BbaC288b26b38A98c4De9884ad4d97dc324B323](https://mumbai.polygonscan.com/address/0x8BbaC288b26b38A98c4De9884ad4d97dc324B323) |
| nTSLA/USDC   | [0xc6cb70d5C8d98C9399D4c37E6135dF31551c3A40](https://polygonscan.com/address/0xc6cb70d5C8d98C9399D4c37E6135dF31551c3A40) |  [0x211B33e5231907E26ab6FD8CAa3F6eA81936D15e](https://mumbai.polygonscan.com/address/0x211B33e5231907E26ab6FD8CAa3F6eA81936D15e) |
| nTSLA   | [0x20796C1C7738992E598B81062b41f2E0b8A8c382](https://polygonscan.com/address/0x20796C1C7738992E598B81062b41f2E0b8A8c382) |  [0x975ABb141eD45F8dAaCA49C15EF8D3650AbE0cc9](https://mumbai.polygonscan.com/address/0x975ABb141eD45F8dAaCA49C15EF8D3650AbE0cc9) |
| sTSLA   | [0xb6F1739cD40d8933127Ee2F2D58b81caDc74A8e0](https://polygonscan.com/address/0xb6F1739cD40d8933127Ee2F2D58b81caDc74A8e0) |  [0x362dB5C57CbD3CF43491134F79c334bC2a10db86](https://mumbai.polygonscan.com/address/0x362dB5C57CbD3CF43491134F79c334bC2a10db86) |
| nAAPL/USDC   | [0x59B051Cf1e68de4c9EDD4CFf0582447634306839](https://polygonscan.com/address/0x59B051Cf1e68de4c9EDD4CFf0582447634306839) | [0xDD8235664df4Ca35Ee0B814e4B4F80B82961c89f](https://mumbai.polygonscan.com/address/0xDD8235664df4Ca35Ee0B814e4B4F80B82961c89f) |
| nAAPL   | [0x29da66CeE2b8BE4157F4988bFAd0906fdC211C27](https://polygonscan.com/address/0x29da66CeE2b8BE4157F4988bFAd0906fdC211C27) | [0xe2D34f6f9939ACDDdAB8612B0ADbE7B9f3c8F0c0](https://mumbai.polygonscan.com/address/0xe2D34f6f9939ACDDdAB8612B0ADbE7B9f3c8F0c0) |
| sAAPL   | [0x02e6C0cAD535f49b2d3D596843D8a3908833aA8d](https://polygonscan.com/address/0x02e6C0cAD535f49b2d3D596843D8a3908833aA8d) | [0x4e0726a2eC86042321Dd7C62aa1AA357D81638cC](https://mumbai.polygonscan.com/address/0x4e0726a2eC86042321Dd7C62aa1AA357D81638cC) |

| Main Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Mint   | [0xB7957FE76c2fEAe66B57CF3191aFD26d99EC5599](https://polygonscan.com/address/0xB7957FE76c2fEAe66B57CF3191aFD26d99EC5599) |  [0x2bFA60Fe6FDd82e732C0f8b7A87Ca6753b0167f0](https://mumbai.polygonscan.com/address/0x2bFA60Fe6FDd82e732C0f8b7A87Ca6753b0167f0) |
| SwapRouter   | [0x270Ec6bE0C9D67370C2B247D5AF1CC0B7dED0d4a](https://polygonscan.com/address/0x270Ec6bE0C9D67370C2B247D5AF1CC0B7dED0d4a) |  [0xeF1F06F0a9645A143Eaccb543f5bda85A9BD21D9](https://mumbai.polygonscan.com/address/0xeF1F06F0a9645A143Eaccb543f5bda85A9BD21D9) |
| SwapFactory   | [0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97](https://polygonscan.com/address/0xa07dD2e9fa20C14C45A28978041b4c64e45f7f97) |  [0x03A8C741d36a8bF689A24C1F5d59cc122704E85F](https://mumbai.polygonscan.com/address/0x03A8C741d36a8bF689A24C1F5d59cc122704E85F) |
| MasterChef   | [0x35cA0e02C4c16c94c4cC8B67D13d660b78414f95](https://polygonscan.com/address/0x35cA0e02C4c16c94c4cC8B67D13d660b78414f95) |  [0xFe12AddfCDa0047aE304ADe81cEA6eBEe304a35d](https://mumbai.polygonscan.com/address/0xFe12AddfCDa0047aE304ADe81cEA6eBEe304a35d) |
| Admin   | [0x3F71D535a8dFFB933779915a89f8b7B321140344](https://polygonscan.com/address/0x3F71D535a8dFFB933779915a89f8b7B321140344) |  [0x1CAeb6856D561b317b29E7021B65F53f287346f6](https://mumbai.polygonscan.com/address/0x1CAeb6856D561b317b29E7021B65F53f287346f6) |
| Asset   | [0x6788fFdeA052875f7e5F6F0Dc5aa8e5003308049](https://polygonscan.com/address/0x6788fFdeA052875f7e5F6F0Dc5aa8e5003308049) |  [0x696C515e9E33f4e6c63645fac21701C0277e54d3](https://mumbai.polygonscan.com/address/0x696C515e9E33f4e6c63645fac21701C0277e54d3) |
| Positions   | [0xADaE61C3D7D4853f71f8e0623fE70622C708F266](https://polygonscan.com/address/0xADaE61C3D7D4853f71f8e0623fE70622C708F266) |  [0x9578da0aCfcAD212CCfd707acA3e0E2Ee9bf9EeC](https://mumbai.polygonscan.com/address/0x9578da0aCfcAD212CCfd707acA3e0E2Ee9bf9EeC) |
| ShortLock   | [0x8EdF0c0f9C56B11A5bE56CB816A2e57c110f44b1](https://polygonscan.com/address/0x8EdF0c0f9C56B11A5bE56CB816A2e57c110f44b1) |  [0xF68352670672db755dbD55a3d9Ff8B47d2c76Eb0](https://mumbai.polygonscan.com/address/0xF68352670672db755dbD55a3d9Ff8B47d2c76Eb0) |
| ShortStaking   | [0xB68F3D8E341B88df22a73034DbDE3c888f4bE9DE](https://polygonscan.com/address/0xB68F3D8E341B88df22a73034DbDE3c888f4bE9DE) |  [0xdD686588B64C29Bef6498f579e892AdAA293a6f3](https://mumbai.polygonscan.com/address/0xdD686588B64C29Bef6498f579e892AdAA293a6f3) |
| LongStaking   | [0xcA502B303c07c60E71a953cF34c6A512EBC61Bc6](https://polygonscan.com/address/0xcA502B303c07c60E71a953cF34c6A512EBC61Bc6) |  [0x1aD73968E12BaFB6342A0017c04309b31bC4C193](https://mumbai.polygonscan.com/address/0x1aD73968E12BaFB6342A0017c04309b31bC4C193) |
| MultiCall   | [0xA8B0637C7F0e923F72f903DbC8169a8a186433D6](https://polygonscan.com/address/0xA8B0637C7F0e923F72f903DbC8169a8a186433D6) |  [0x872808abd468F80c80213f48a5E917b5F5c371f8](https://mumbai.polygonscan.com/address/0x872808abd468F80c80213f48a5E917b5F5c371f8) |
| Auction   | [0x0C9133Fa96d72C2030D63B6B35c3738D6329A313](https://polygonscan.com/address/0x0C9133Fa96d72C2030D63B6B35c3738D6329A313) | [0xEEdCB4689B55956E1fd434790b9703466B93Ea7D](https://mumbai.polygonscan.com/address/0xEEdCB4689B55956E1fd434790b9703466B93Ea7D) |

| Oracle Contracts | Mainnet                                                                                                       | Mumbai
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| nSE Oracle   | [0xcc73e00db7a6FD589a30BbE2E957086b8d7D3331](https://polygonscan.com/address/0xcc73e00db7a6FD589a30BbE2E957086b8d7D3331) |  [0xEEeEB911f1c30217EfFC662B157f8BAF91f1133b](https://mumbai.polygonscan.com/address/0xEEeEB911f1c30217EfFC662B157f8BAF91f1133b) |
| nTSLA Oracle   | [0x567E67f456c7453c583B6eFA6F18452cDee1F5a8](https://polygonscan.com/address/0x567E67f456c7453c583B6eFA6F18452cDee1F5a8) |  [0xDb12E805d004698FC58F6e4fbdD876268DF2dfFe](https://mumbai.polygonscan.com/address/0xDb12E805d004698FC58F6e4fbdD876268DF2dfFe) |
| nAAPL Oracle   | [0x7E7B45b08F68EC69A99AAb12e42FcCB078e10094](https://polygonscan.com/address/0x7E7B45b08F68EC69A99AAb12e42FcCB078e10094) | [0x78ded7ecC5149Ee1f6d0DacfaD4F20882fDEe663](https://mumbai.polygonscan.com/address/0x78ded7ecC5149Ee1f6d0DacfaD4F20882fDEe663) |
