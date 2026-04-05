require("dotenv").config();
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧾 CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { amount, wallet, nft_id } = req.body;

    const id = uuidv4();

    // 🔑 tạo nội dung thanh toán duy nhất
    const payment_content = "ORDER_" + Date.now();

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          id,
          nft_id,
          buyer_address: wallet,
          amount,
          status: "pending",
          payment_content
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 🔗 nội dung QR
    const qrData = JSON.stringify({
      address: process.env.WALLET_ADDRESS,
      amount,
      content: payment_content
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.json({
      orderId: id,
      qrImage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create order failed" });
  }
});

// 🔍 GET ORDER
app.get("/order/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error });

  res.json(data);
});

app.listen(process.env.PORT, () => {
  console.log("🚀 Server running");
});
