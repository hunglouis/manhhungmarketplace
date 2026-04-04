require("dotenv").config();
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

const app = express();
app.use(express.json());

const orders = {}; // production → dùng DB

// 🧾 Tạo order + QR
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const orderId = uuidv4();

  const payload = {
    orderId,
    amount,
    address: process.env.WALLET_ADDRESS
  };

  const qrString = JSON.stringify(payload);

  const qrImage = await QRCode.toDataURL(qrString);

  orders[orderId] = {
    ...payload,
    status: "pending"
  };

  res.json({ orderId, qrImage });
});

// 🔍 Check trạng thái
app.get("/order/:id", (req, res) => {
  res.json(orders[req.params.id]);
});

app.listen(process.env.PORT, () => {
  console.log("Backend running...");
});
