import hre from "hardhat";

async function main() {
  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const nft = await SimpleNFT.deploy();

  await nft.waitForDeployment();

  console.log("NFT Contract deployed to:", await nft.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
