require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();

console.log("===== ENV CHECK =====");
console.log("CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "OK" : "MISSING");
console.log("RPC_URL:", process.env.RPC_URL ? "OK" : "MISSING");


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
  console.error("❌ ERROR:", err.message);
  console.error(err);

  res.status(500).json({
    error: "fail",
    message: err.message
  });
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
  console.log("CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

});
