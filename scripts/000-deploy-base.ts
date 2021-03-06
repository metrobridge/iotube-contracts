import * as fs from "fs";
import { ethers, network, upgrades } from "hardhat"

import { EmergencyOperator } from "../types/EmergencyOperator"
import { LedgerV2 } from "../types/LedgerV2"
import { LordV2 } from "../types/LordV2"
import { MinterDAO } from "../types/MinterDAO"

async function main() {
  const [deployer] = await ethers.getSigners()

  const deployment = {}
  const EmergencyOperatorFactory = await ethers.getContractFactory("EmergencyOperator")
  const emergencyOperator = await upgrades.deployProxy(EmergencyOperatorFactory) as EmergencyOperator
  await emergencyOperator.deployed()
  console.log("Emergency Operator deployed to:", emergencyOperator.address)
  deployment["emergencyOperator"] = emergencyOperator.address

  const LordV2Factory = await ethers.getContractFactory("LordV2")
  const lordV2 = await upgrades.deployProxy(LordV2Factory, []) as LordV2;
  await lordV2.deployed()
  console.log("LordV2 deployed to:", lordV2.address)
  deployment["lord"] = lordV2.address

  const LedgerV2Factory = await ethers.getContractFactory("LedgerV2")
  const ledgerV2 = await LedgerV2Factory.deploy() as LedgerV2
  await ledgerV2.deployed();
  console.log("LedgerV2 deployed to:", ledgerV2.address)
  deployment["ledger"] = ledgerV2.address

  const Verifier = await ethers.getContractFactory("VerifierV2")
  const verifier = await Verifier.deploy(emergencyOperator.address)
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address)
  deployment["verifier"] = verifier.address
  
  const ERC20Tube = await ethers.getContractFactory("ERC20Tube")
  const tube = await ERC20Tube.deploy(
    process.env.TUBE_ID, // tubeID
    ledgerV2.address, // ledger
    lordV2.address, // lord
    verifier.address, // verifier
    process.env.SAFE, // safe
    0, // initNonce
    emergencyOperator.address, // emergency operator address
  )
  await tube.deployed()
  console.log("ERC20Tube deployed to:", tube.address)
  deployment["tube"] = tube.address

  // add operator
  let tx = await ledgerV2.addOperator(tube.address)
  await tx.wait()
  tx = await lordV2.addOperator(tube.address)
  await tx.wait()

  const MinterDAOFactory = await ethers.getContractFactory("MinterDAO")
  const minterDAO = await upgrades.deployProxy(MinterDAOFactory, [
    lordV2.address,
    emergencyOperator.address
  ]) as MinterDAO;
  await minterDAO.deployed()
  console.log("MinterDAO deployed to:", lordV2.address)
  deployment["minterDAO"] = minterDAO.address

  const CrosschainERC20FactoryV2 = await ethers.getContractFactory("CrosschainERC20FactoryV2")
  const cTokenFactory = await CrosschainERC20FactoryV2.deploy(minterDAO.address)
  await cTokenFactory.deployed()
  console.log("CrosschainERC20FactoryV2 deployed to:", cTokenFactory.address)
  deployment["crosschainERC20Factory"] = cTokenFactory.address

  const ERC20TubeRouter = await ethers.getContractFactory("ERC20TubeRouter")
  // use deployer's address as default safe address
  const router = await ERC20TubeRouter.deploy(tube.address, deployer.address)
  await router.deployed();
  console.log("ERC20TubeRouter deployed to:", router.address)
  deployment["erc20TubeRouter"] = router.address

  if(!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments")
  }
  fs.writeFileSync(`./deployments/${network.name}.json`, JSON.stringify(deployment, null, 4))
}

main()
  .then(() => process.exit(0))
  .catch((error) => { 
    console.error(error)
    process.exit(1)
  })
