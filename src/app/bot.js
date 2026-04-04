require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

provider.on("block", async (blockNumber) => {
  const block = await provider.getBlockWithTransactions(blockNumber);

  for (let tx of block.transactions) {
    if (
      tx.to &&
      tx.to.toLowerCase() === process.env.WALLET_ADDRESS.toLowerCase()
    ) {
      console.log("Payment detected:", tx.hash);

      // TODO:
      // 1. match order
      // 2. call smart contract
    }
  }
});
