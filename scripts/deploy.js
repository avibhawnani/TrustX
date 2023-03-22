const hre = require("hardhat");
async function main() {

  const Contract = await hre.ethers.getContractFactory("TrustX");
  const contract = await Contract.deploy();

  await contract.deployed();

  console.log("Contract Address : ",contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// 0x93933839BC83E9Bb2AdAE6375cb4C4C64048c69D