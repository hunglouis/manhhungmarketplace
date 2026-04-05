"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

export default function Page() {
  const [wallet, setWallet] = useState(null);
  const [approved, setApproved] = useState(false);
  const [status, setStatus] = useState("");

  const [amount, setAmount] = useState(0.01);
  const [orderId, setOrderId] = useState(null);
  const [qr, setQr] = useState(null);

  const contractAddress = "0xYourContractAddress";
  const botAddress = "0xYourBotAddress";

  // ✅ ABI tối thiểu
  const contractABI = [
    {
      inputs: [
        { internalType: "address", name: "operator", type: "address" },
        { internalType: "bool", name: "approved", type: "bool" }
      ],
      name: "setApprovalForAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "operator", type: "address" }
      ],
      name: "isApprovedForAll",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function"
    }
  ];

  // 🔗 CONNECT WALLET
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Cài MetaMask!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    setWallet(address);
    setStatus("Đã kết nối ví");
  };

  // 🔍 CHECK APPROVE
  const checkApproval = async () => {
    if (!wallet) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const isApproved = await contract.isApprovedForAll(
      wallet,
      botAddress
    );

    setApproved(isApproved);
  };

  // 🔐 APPROVE BOT
  const approveBot = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setStatus("Đang approve...");

      const tx = await contract.setApprovalForAll(botAddress, true);
      await tx.wait();

      setApproved(true);
      setStatus("✅ Approve thành công!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Lỗi approve");
    }
  };

  // 🧾 TẠO ORDER + QR
  const createOrder = async () => {
    try {
      setStatus("Đang tạo đơn...");

      const res = await axios.post(
        "http://localhost:4000/create-order",
        {
          amount,
          wallet
        }
      );

      setOrderId(res.data.orderId);
      setQr(res.data.qrImage);

      setStatus("⏳ Chờ thanh toán...");
    } catch (err) {
      console.error(err);
      setStatus("❌ Lỗi tạo đơn");
    }
  };

  // 🔄 POLL PAYMENT
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/order/${orderId}`
        );

        if (res.data?.status === "paid") {
          setStatus("✅ Đã thanh toán!");
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // 🔄 CHECK APPROVE
  useEffect(() => {
    if (wallet) checkApproval();
  }, [wallet]);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🧾 Web3 Checkout Full</h1>

      {/* CONNECT */}
      <button onClick={connectWallet}>
        {wallet ? "✅ Connected" : "🔗 Connect Wallet"}
      </button>

      <p>{wallet}</p>

      {/* AMOUNT */}
      <div style={{ marginTop: 20 }}>
        <label>Số tiền:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* APPROVE */}
      {wallet && !approved && (
        <button onClick={approveBot}>
          🔐 Approve Bot
        </button>
      )}

      {/* CREATE ORDER */}
      {approved && (
        <button
          onClick={createOrder}
          style={{ marginTop: 20 }}
        >
          💳 Tạo QR thanh toán
        </button>
      )}

      {/* QR */}
      {qr && (
        <div style={{ marginTop: 20 }}>
          <img src={qr} width={250} />
          <p>Order: {orderId}</p>
        </div>
      )}

      {/* STATUS */}
      <div style={{ marginTop: 20 }}>
        <b>Status:</b> {status}
      </div>

      {/* SUCCESS */}
      {status.includes("Đã thanh toán") && (
        <div style={{ marginTop: 20, background: "#d4edda", padding: 20 }}>
          ✅ Thanh toán thành công  
          👉 Bot có thể mint NFT / unlock content
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#050505', color: '#fff', minHeight: '100vh', padding: '120px 40px' },
  navbar: { position: 'fixed', top: '15px', left: '20px', right: '20px', backgroundColor: 'rgba(15, 15, 15, 0.8)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'space-between', padding: '15px 30px', borderRadius: '100px', border: '1px solid #333', zIndex: 1000 },
  navLogo: { fontSize: '20px', fontWeight: '900' },
  visitBadge: { color: '#6366f1', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(99,102,241,0.2)', padding: '5px 15px', borderRadius: '50px', backgroundColor: 'rgba(99,102,241,0.05)' },
  btnNav: { background: 'linear-gradient(90deg, #6366f1, #a855f7)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' },
  sectionMax: { maxWidth: '650px', margin: '0 auto 60px' },
  cardGlass: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '35px', borderRadius: '32px', border: '1px solid #222', backdropFilter: 'blur(15px)' },
  feeNotice: { backgroundColor: 'rgba(99, 102, 241, 0.03)', padding: '15px', borderRadius: '15px', marginBottom: '25px', border: '1px solid rgba(99, 102, 241, 0.1)' },
  input: { width: '100%', padding: '14px', marginBottom: '15px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '14px', color: '#fff', outline: 'none' },
  btnActionPrimary: { width: '100%', padding: '16px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '16px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },
  nftCard: { backgroundColor: '#111', borderRadius: '28px', overflow: 'hidden', border: '1px solid #222', transition: '0.4s' },
  imageWrapper: { position: 'relative', aspectRatio: '1/1' },
  nftImage: { width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' },
  playOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(99, 102, 241, 0.9)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', cursor: 'pointer' },
  nftContent: { padding: '20px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' },
  btnBuy: { backgroundColor: '#fff', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  btnOffer: { backgroundColor: 'transparent', color: '#555', padding: '10px 20px', borderRadius: '12px', border: '1px solid #333' },
  sectionFull: { marginTop: '80px', backgroundColor: 'rgba(255,255,255,0.01)', padding: '45px', borderRadius: '35px', border: '1px solid #222' },
  historyBox: { display: 'flex', flexDirection: 'column', gap: '18px' },
  historyRow: { display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #1a1a1a' },
  gridSmall: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' },
  nftCardSmall: { backgroundColor: '#000', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: '#111', padding: '35px', borderRadius: '30px', width: '380px', textAlign: 'center', border: '1px solid #333' },
  modalContentQR: { backgroundColor: '#111', padding: '35px', borderRadius: '30px', width: '420px', border: '1px solid #333' },
  fixedPlayer: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', backgroundColor: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(20px)', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '25px', border: '1px solid #333', zIndex: 3000 },
  btnConnect: { background: 'linear-gradient(90deg, #6366f1, #a855f7)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' },
  container: { backgroundColor: '#050505', color: '#fff', minHeight: '100vh', padding: '120px 40px 150px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', position: 'fixed', top: '15px', left: '20px', right: '20px', backgroundColor: 'rgba(15, 15, 15, 0.8)', backdropFilter: 'blur(15px)', borderRadius: '100px', border: '1px solid #333', zIndex: 2000 },
  navLogo: { fontSize: '20px', fontWeight: '900' },
  navLinks: { display: 'flex', gap: '20px', alignItems: 'center' },
  navItem: { color: '#888', fontSize: '14px', cursor: 'pointer' },
  authGroup: { display: 'flex', alignItems: 'center', backgroundColor: '#111', padding: '5px 15px', borderRadius: '50px' },
  btnNavText: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  divider: { width: '1px', height: '15px', backgroundColor: '#333', margin: '0 15px' },
  btnConnect: { background: 'linear-gradient(90deg, #6366f1, #a855f7)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' },
  
  mintSection: { maxWidth: '600px', margin: '0 auto 60px' },
  card: { backgroundColor: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222' },
  input: { width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: '#fff' },
  btnMint: { width: '100%', padding: '15px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' },
  btnDisabled: { width: '100%', padding: '15px', backgroundColor: '#333', color: '#888', borderRadius: '12px', border: 'none', marginTop: '20px' },
  statusText: { textAlign: 'center', marginTop: '10px', color: '#6366f1', fontSize: '13px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },
  nftCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid #222', overflow: 'hidden', backdropFilter: 'blur(10px)', transition: '0.4s' },
  imageWrapper: { position: 'relative', aspectRatio: '1/1' },
  nftImage: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: '0.3s', cursor: 'pointer' },
  playIcon: { width: '60px', height: '60px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' },
  nftContent: { padding: '20px' },
  nftTitle: { fontSize: '18px', fontWeight: '800', marginBottom: '5px' },
  nftArtist: { fontSize: '13px', color: '#888', marginBottom: '15px' },
  nftFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceValue: { fontWeight: 'bold', color: '#6366f1' },
  btnBuySmall: { padding: '8px 15px', backgroundColor: '#fff', color: '#000', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },

  fixedPlayer: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(15px)', padding: '15px 40px', borderTop: '1px solid #333', zIndex: 3000 },
  playerContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  trackInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  miniCover: { width: '50px', height: '50px', borderRadius: '8px' },
  miniTitle: { fontWeight: 'bold', fontSize: '14px' },
  miniArtist: { fontSize: '12px', color: '#888' },
  mainVideo: { height: '60px', borderRadius: '8px' },
  btnClose: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000 },
  modalContent: { backgroundColor: '#111', padding: '40px', borderRadius: '32px', width: '400px', textAlign: 'center', border: '1px solid #333' },
  modalInput: { width: '100%', padding: '15px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff' },
  btnActionPrimary: { width: '100%', padding: '15px', background: 'linear-gradient(90deg, #6366f1, #a855f7)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' },
  
  toastContainer: { position: 'fixed', bottom: '100px', right: '30px', backgroundColor: '#6366f1', padding: '15px 25px', borderRadius: '15px', zIndex: 5000 },
  toastMessage: { color: '#fff', fontWeight: 'bold' },
  btnChat: {
    padding: '8px 15px',
    backgroundColor: '#0068ff', // Màu xanh Zalo đặc trưng
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    width: '100%',
    transition: '0.3s',
  },
  input: {
    width: '100%',
    padding: '14px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    marginBottom: '15px',
  },
  customFileBtn: {
    display: 'block',
    padding: '12px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '2px dashed rgba(99, 102, 241, 0.4)',
    borderRadius: '14px',
    color: '#6366f1',
    textAlign: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '20px',
    transition: '0.3s',
  },
  btnMint: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(90deg, #6366f1, #a855f7)', // Gradient rực rỡ
    color: '#fff',
    borderRadius: '16px',
    border: 'none',
    fontWeight: '800',
    fontSize: '16px',
    letterSpacing: '1px',
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
    transition: 'all 0.3s ease',
  },
  authInfo: { fontSize: '13px', color: '#888', marginBottom: '15px', textAlign: 'center' },
  uploadBox: { border: '2px dashed #333', borderRadius: '15px', padding: '20px', textAlign: 'center', marginBottom: '15px' },
  fileLabel: { cursor: 'pointer', color: '#6366f1', fontWeight: 'bold' },
  loginInvite: { padding: '40px', textAlign: 'center', backgroundColor: '#111', borderRadius: '25px', border: '1px solid #222' },
  nftStats: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', margin: '15px 0' },
  priceText: { color: '#6366f1', fontWeight: 'bold', fontSize: '15px' },
  btnZalo: { width: '100%', padding: '12px', backgroundColor: '#0068ff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
// Thêm vào styles
  fileInputCustom: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#6366f1',
    color: '#fff',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  loginInvite: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '24px',
    border: '1px dashed #333',
    maxWidth: '600px',
    margin: '0 auto 60px',
  },
  feeNotice: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    textAlign: 'left'
  },
  feeList: {
    fontSize: '12px',
    color: '#aaa',
    lineHeight: '1.8',
    paddingLeft: '20px',
    listStyleType: 'disc'
  },
  visitBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#6366f1',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  btnVietQR: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fff',
    color: '#0056b3', // Màu xanh đặc trưng BIDV
    borderRadius: '12px',
    border: '1px solid #0056b3',
    fontWeight: 'bold',
    marginTop: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  historySection: { marginTop: '80px', padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid #222' },
  historyTitle: { fontSize: '24px', fontWeight: '800', marginBottom: '25px', textAlign: 'center' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #222' },
  txStatus: { backgroundColor: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', marginRight: '15px' },
  txNftName: { fontSize: '16px', color: '#fff' },
  txPrice: { color: '#6366f1', fontWeight: 'bold', marginLeft: '20px' },
  txTime: { color: '#555', fontSize: '12px', marginLeft: '20px' },
  qrModalContent: {
    backgroundColor: '#111',
    padding: '30px',
    borderRadius: '24px',
    width: '380px',
    textAlign: 'center',
    border: '1px solid #333',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
  },
  qrHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
  qrDesc: { fontSize: '14px', color: '#aaa', marginBottom: '20px' },
  qrImageContainer: { backgroundColor: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '20px' },
  qrImage: { width: '100%', height: 'auto', display: 'block' },
  btnDone: { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#6366f1', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    marginTop: '15px',
    cursor: 'pointer'
  },

};