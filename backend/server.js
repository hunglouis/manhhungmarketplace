const express = require('express');
const cors = require('cors');
const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors()); // Thay thế hoàn toàn cho dòng cấu hình cũ

require("dotenv").config();
const { ethers } = require("ethers");

const wallet = "0x8429BC345266D03a433b25B8Fb6301274294D81E";
const url = "https://api.opensea.io/api/v2/chain/polygon/account/$wallet/nfts";

const options = {
  'method': "GET",
  'header': {
    'Accept': application / json,
    'X-API-KEY': b736ad1e23c74136b98079b71923bfcb

  }
};

// Thay thế hoàn toàn cho dòng 23 và 24 của PHP
fetch(url, options)
  .then(res => res.json())
  .then(data => {
    console.log("Dữ liệu Opensea nhận được:", data);
    // Bạn có thể xử lý biến 'data' này ở đây (ví dụ: res.json(data) để trả về client)
  })
  .catch(err => console.error("Lỗi khi gọi API Opensea:", err));


// 1. LẤY TỶ GIÁ REALTIME (30 giây cập nhật một lần ở Backend)
// Khởi tạo một biến global để lưu tỷ giá dùng chung cho toàn bộ API backend
let currentRates = { eth: 0, usdt: 0 };

const fetchRates = async () => {
  try {
    // Sửa lại URL API chuẩn của CoinGecko để lấy giá VND (Link cũ https://coingecko.com của bạn chỉ trả về HTML trang chủ, sẽ bị lỗi .json())
    const res = await fetch('https://coingecko.com');
    const data = await res.json();

    currentRates = {
      eth: data.ethereum.vnd,
      usdt: data.tether.vnd
    };
    console.log("📊 Cập nhật tỷ giá thành công:", currentRates);
  } catch (err) {
    console.error("Lỗi cập nhật tỷ giá:", err);
  }
};

// Chạy kích hoạt lần đầu tiên ngay khi khởi động server
fetchRates();

// Thiết lập tự động chạy lại sau mỗi 30 giây
setInterval(fetchRates, 30000);

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
