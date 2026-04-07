require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

console.log("🚀 Web3 Server running...");

// 🔥 WEBHOOK TỪ PHP
app.post("/webhook-payment", async (req, res) => {
  try {
    const { order_id, amount } = req.body;

    console.log("💰 Payment received:", order_id);

    // 👉 TODO: lấy buyer_address từ DB
    const buyer = process.env.DEFAULT_BUYER;

    await mintNFT(buyer, order_id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mint failed" });
  }
});

// 🎨 MINT NFT
async function mintNFT(to, orderId) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider
  );

  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    JSON.parse(process.env.CONTRACT_ABI),
    wallet
  );

  console.log("🎨 Minting NFT...");

  const tx = await contract.mint(
    to,
    "ipfs://metadata/" + orderId
  );

  console.log("⏳ Waiting tx:", tx.hash);

  await tx.wait();

  console.log("🎉 SUCCESS:", tx.hash);
}
