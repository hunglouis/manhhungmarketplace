header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();


$wallet = "0x8429BC345266D03a433b25B8Fb6301274294D81E";

$url = "https://api.opensea.io/api/v2/chain/polygon/account/$wallet/nfts";

$options = [
    "http" => [
        "method" => "GET",
        "header" => [
            "Accept: application/json",
            "X-API-KEY:b736ad1e23c74136b98079b71923bfcb"
        ]
    ]
];

$context = stream_context_create($options);
echo file_get_contents($url, false, $context);

// 1. LẤY TỶ GIÁ REALTIME (30 giây cập nhật một lần)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://coingecko.com');
        const data = await res.json();
        setRates({ eth: data.ethereum.vnd, usdt: data.tether.vnd });
      } catch (err) { console.error("Lỗi cập nhật tỷ giá:", err); }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

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
  console.log("===== ENV CHECK =====");
  console.log("🚀 Server running");
  console.log("CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);
  console.log("SERVICE CHECK:", process.env.RENDER_SERVICE_NAME);

});
