import * as fs from "fs";
import { ethers, run, network } from "hardhat"

import { ERC20TubeRouter } from "../../types/ERC20TubeRouter";

async function verify(params: any) {
  try {
    await run("verify:verify", params)
  } catch (error) {
    // @ts-ignore
    console.log(`contract ${params.contract} fail: ${error.message}`)
  }
}

async function main() {
  const deployments = JSON.parse(fs.readFileSync(`./deployments/${network.name}.json`).toString())

  const emergencyOperatorImplement = `0x${(await ethers.provider.getStorageAt(
    deployments.emergencyOperator,
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  )).substring(26)}`
  await verify({
    contract: "contracts/v0.2/EmergencyOperator.sol:EmergencyOperator",
    address: emergencyOperatorImplement,
  })
  const lordImplement = `0x${(await ethers.provider.getStorageAt(
    deployments.lord,
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  )).substring(26)}`
  await verify({
    contract: "contracts/v0.2/LordV2.sol:LordV2",
    address: lordImplement,
  })
  await verify({
    contract: "contracts/v0.2/LedgerV2.sol:LedgerV2",
    address: deployments.ledger,
  })
  await verify({
    contract: "contracts/v0.2/VerifierV2.sol:VerifierV2",
    address: deployments.verifier,
    constructorArguments: [
      deployments.emergencyOperator
    ],
  })
  await verify({
    contract: "contracts/v0.2/ERC20Tube.sol:ERC20Tube",
    address: deployments.tube,
    constructorArguments: [
      process.env.TUBE_ID,
      deployments.ledger,
      deployments.lord,
      deployments.verifier,
      process.env.SAFE,
      0,
      deployments.emergencyOperator
    ],
  })
  const minterDAOImplement = `0x${(await ethers.provider.getStorageAt(
    deployments.minterDAO,
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  )).substring(26)}`
  await verify({
    contract: "contracts/v0.2/MinterDAO.sol:MinterDAO",
    address: minterDAOImplement,
  })
  await verify({
    contract: "contracts/v0.2/CrosschainERC20FactoryV2.sol:CrosschainERC20FactoryV2",
    address: deployments.crosschainERC20Factory,
    constructorArguments: [
      deployments.minterDAO
    ],
  })

  const router = await ethers.getContractAt(
    "ERC20TubeRouter", deployments.erc20TubeRouter
  ) as ERC20TubeRouter
  await verify({
    contract: "contracts/v0.2/ERC20TubeRouter.sol:ERC20TubeRouter",
    address: deployments.erc20TubeRouter,
    constructorArguments: [
      deployments.tube,
      await router.owner()
    ],
  })

  // await verify({
  //   contract: "contracts/v0.2/CrosschainERC20V2.sol:CrosschainERC20V2",
  //   address: "0xfEC51632aF0CF8075e6F391b5F7dC33E28B375C4",
  //   constructorArguments: [
  //     deployments.minterDAO,
  //     "Crosschain USDT",
  //     "cUSDT",
  //     6
  //   ],
  // })
  // await verify({
  //   contract: "contracts/v0.2/CrosschainERC20V2Pair.sol:CrosschainERC20V2Pair",
  //   address: "0xA151F8fe931fd6ae8541d7e614485A18e292f666",
  //   constructorArguments: [
  //     "0xfEC51632aF0CF8075e6F391b5F7dC33E28B375C4",
  //     6,
  //     "0x55d398326f99059fF775485246999027B3197955",
  //     18,
  //     "0xa8683aadd56a60d9bcf9e0f57a65ff53333bae7e"
  //   ],
  // })
}

main()
  .then(() => process.exit(0))
  .catch((error) => { 
    console.error(error)
    process.exit(1)
  })
