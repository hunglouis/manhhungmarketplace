require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API RUNNING 🚀");
});

// 🔥 WEBHOOK
app.post("/webhook-payment", async (req, res) => {
  try {
    const { order_id } = req.body;

    console.log("💰 Payment:", order_id);

    const buyer = process.env.DEFAULT_BUYER;

    await mintNFT(buyer, order_id);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "fail" });
  }
});

// 🎨 MINT
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

  const tx = await contract.mint(
    to,
    "ipfs://metadata/" + orderId
  );

  await tx.wait();

  console.log("✅ Mint:", tx.hash);
}

app.listen(10000, () => {
  console.log("🚀 Server running");
});
