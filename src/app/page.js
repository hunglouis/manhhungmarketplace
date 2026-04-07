"use client";
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios'; 
// Hoặc nếu dùng script tag ở HTML thì thêm:
// <script src="https://jsdelivr.net"></script>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
 // Thông tin ngân hàng của bạn (Sửa tại đây)
const MY_BANK = "BIDV"; 
const MY_ACCOUNT = "3120464627";


export default function MusicNFTStudio() {
  const [amount, setAmount] = useState(""); 
  const [walletAddress, setWalletAddress] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [rates, setRates] = useState({ eth: 1, usdt: 2065 ,vnd: 60000000}); // Mặc định để tránh lỗi chia cho 0
  const [selectednft, setselectednft] = useState(null);
  const [orderCode, setOrderCode] = useState("");
  const [playingId, setPlayingId] = useState(null);
    const [ethPriceUSD, setEthPriceUSD] = useState(2065); // Giá mặc định nếu API lỗi
	const [order, setOrder] = useState(null);
    const [authEmail, setAuthEmail] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);
    const [activeQRUrl, setActiveQRUrl] = useState('');
    const [userWalletAddress, setUserWalletAddress] = useState('');

    useEffect(() => {
        fetchNFTs();
    }, []);
	const fetchETHPrice = async () => {
  try {
    const res = await axios.get('https://coingecko.com');
    const price = res.data.ethereum.usd;
    setEthPriceUSD(price);
    console.log("🚀 Giá ETH mới nhất:", price, "USD");
  } catch (err) {
    console.error("Không lấy được giá ETH mới:", err);
  }
};

// Tự động cập nhật mỗi 5 phút
useEffect(() => {
  fetchETHPrice();
  const interval = setInterval(fetchETHPrice, 300000); 
  return () => clearInterval(interval);
}, []);

    const fetchNFTs = async () => {
        const { data } = await supabase.from('hunglouis').select('*').order('created_at', { ascending: false });
        setNfts(data || []);
    };
 // 3. KẾT NỐI VÍ METAMASK
      const connectWallet = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        // Yêu cầu kết nối ví
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWalletAddress(accounts[0]); // Lấy địa chỉ ví đầu tiên
        console.log("Đã kết nối ví:", accounts[0]);
      } else {
        alert("Không tìm thấy Metamask. Vui lòng cài đặt tiện ích này trên trình duyệt!");
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error.message);
      alert("Người dùng đã từ chối kết nối hoặc có lỗi xảy ra.");
    }
  };

 

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

  // 2. LẤY DANH SÁCH NFT TỪ SUPABASE
  useEffect(() => {
    const fetchNfts = async () => {
      const { data, error } = await supabase.from('hunglouis').select('*');
      if (data) setNfts(data);
    };
    fetchNfts();
  }, []);

  
  // 4. HÀM XỬ LÝ MUA HÀNG (TẠO ĐƠN VÀO SUPABASE)
  const handleBuy = async (nft) => {
    if (!walletAddress) return alert("Vui lòng kết nối ví trước!");
    
    const newCode = "MH" + Math.floor(Math.random() * 1000000);
    try {
      const { error } = await supabase.from('order').insert([
        { 
          amount: nft.price, 
          buyer_address: walletAddress, 
          payment_content: newCode, 
          status: 'pending', 
          nft_id: nft.id 
        }
      ]);
      if (error) throw error;
      setOrderCode(newCode);
      setselectednft(nft);
      setIsPending(true);
    } catch (err) { alert("Lỗi tạo đơn hàng: " + err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">Manh Hung Marketplace</h1>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Decentralized Music NFT Store</p>
          </div>
          {!walletAddress ? (
            <button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-lg shadow-blue-900/20 active:scale-95">KẾT NỐI VÍ 🦊</button>
          ) : (
            <div className="bg-slate-800 px-4 py-2 rounded-xl border border-blue-500/30">
              <span className="text-[10px] text-blue-400 block font-bold uppercase mb-1">Ví đã kết nối:</span>
              <span className="font-mono text-xs text-white">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
            </div>
          )}
        </header>

        {/* SHOWROOM SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl transition hover:border-blue-600 group">
              
              {/* MEDIA VIEW: CLICK TO PLAY */}
              <div 
                className="relative h-72 cursor-pointer overflow-hidden bg-black"
                onClick={() => setPlayingId(playingId === nft.id ? null : nft.id)}
              >
                {playingId === nft.id ? (
                  <video src={nft.media_url} autoPlay controls className="w-full h-full object-contain bg-black" />
                ) : (
                  <>
                    <img src={nft.image_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-500 group-hover:scale-105" alt={nft.name} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 transform transition group-hover:scale-110 shadow-2xl">
                          <span className="text-2xl">▶️</span>
                       </div>
                    </div>
                  </>
                )}
              </div>

              {/* PRICING & BUY SECTION */}
              <div className="p-7 space-y-5">
                <h3 className="text-xl font-black text-white">{nft.name}</h3>
                
                {/* REALTIME RATES */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">ETH</span>
                    <span className="text-[10px] font-black text-orange-400">{(nft.price * rates.eth).toFixed(4)}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">USDT</span>
                    <span className="text-[10px] font-black text-blue-400">{(nft.price * rates.usdt).toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">VND</span>
                    <span className="text-[10px] font-black text-green-400">{(nft.price * rates.vnd).toFixed()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleBuy(nft)}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-950/20 transition-all active:scale-95"
                >
                  MUA NFT NGAY
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- MODAL THANH TOÁN QR --- */}
        {isPending && selectednft && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
             <div className="bg-white text-slate-900 p-8 rounded-[3rem] max-w-sm w-full relative shadow-[0_0_50px_rgba(59,130,246,0.3)] border-4 border-blue-500/20">
                <button onClick={() => setIsPending(false)} className="absolute top-6 right-6 text-2xl font-bold text-slate-400 hover:text-red-500 transition">✕</button>
                
                <h2 className="text-center font-black text-xl mb-2 uppercase tracking-tighter">Thanh toán đơn hàng</h2>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase mb-8 italic tracking-widest">Vui lòng quét mã qua App Ngân hàng</p>
                
                <div className="bg-slate-100 p-4 rounded-[2rem] mb-6 flex justify-center border-2 border-dashed border-slate-300 shadow-inner">
                  <img 
                    src={`https://sepay.vn{selectednft?.price}&des=${orderCode}`} 
                    className="w-64 h-64 mix-blend-multiply"
                    alt="VietQR"
                  />
                </div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                   <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 font-bold uppercase">Nội dung:</span><span className="font-mono font-black text-blue-600 text-lg">{orderCode}</span></div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-200"><span className="text-[10px] text-slate-400 font-bold uppercase">Số tiền:</span><span className="font-black text-red-600 text-lg">{selectednft?.price.toLocaleString()} VND</span></div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-3">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Hệ thống đang chờ xử lý...</p>
                </div>
             </div>
          </div>
        )}

        <footer className="mt-20 text-center py-10 border-t border-slate-900">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[10px]">Manh Hung Marketplace • 2026</p>
        </footer>
      </div>
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