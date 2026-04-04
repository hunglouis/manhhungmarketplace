"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function Page() {
  const [qrCrypto, setQrCrypto] = useState(null);
  const [qrBank, setQrBank] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [amount, setAmount] = useState(0.01);

  // 🧾 Tạo order
  const createOrder = async () => {
    try {
      setStatus("creating");

      const res = await axios.post("http://localhost:4000/create-order", {
        amount
      });

      setQrCrypto(res.data.qrImage);
      setQrBank(res.data.qrBank || null);
      setOrderId(res.data.orderId);
      setStatus("waiting");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  // 🔄 Poll trạng thái thanh toán
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/order/${orderId}`
        );

        if (res.data?.status === "paid") {
          setStatus("paid");
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

async function mintNFT(user, tokenURI) {
  const contract = new ethers.Contract(address, abi, wallet);

  const tx = await contract.mint(user, tokenURI);
  await tx.wait();
}


    return () => clearInterval(interval);
  }, [orderId]);
const VietQR = require("vietqr");

function createVietQR(amount, orderId) {
  const vietQR = new VietQR({
    bankBin: "970422",
    accountNumber: "123456789",
    amount,
    memo: orderId
  });

  return vietQR.build();
}



  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>💳 Payment QR System</h1>

      {/* INPUT */}
      <div style={{ marginBottom: 20 }}>
        <label>Số tiền:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginLeft: 10 }}
        />
      </div>

      {/* BUTTON */}
      <button
        onClick={createOrder}
        style={{
          padding: "10px 20px",
          background: "black",
          color: "white",
          borderRadius: 8
        }}
      >
        Tạo QR thanh toán
      </button>

      {/* STATUS */}
      <div style={{ marginTop: 20 }}>
        <b>Trạng thái:</b> {status}
      </div>

      {/* QR CRYPTO */}
      {qrCrypto && (
        <div style={{ marginTop: 30 }}>
          <h3>🔗 QR Crypto (Polygon)</h3>
          <img src={qrCrypto} width={250} />
          <p>Order: {orderId}</p>
        </div>
      )}

      {/* QR BANK */}
      {qrBank && (
        <div style={{ marginTop: 30 }}>
          <h3>🏦 QR Ngân hàng (VietQR)</h3>
          <img src={qrBank} width={250} />
        </div>
      )}

      {/* SUCCESS */}
      {status === "paid" && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            background: "#d4edda",
            borderRadius: 10
          }}
        >
          ✅ Thanh toán thành công! Đơn hàng đã được xử lý.
        </div>
      )}
    </div>
  );
}
