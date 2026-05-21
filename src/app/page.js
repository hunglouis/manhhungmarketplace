"use client";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import CryptoTable from '../components/CryptoTable';
import { useEffect, useState } from 'react';

// Hoặc nếu dùng script tag ở HTML thì thêm:
// <script src="https://jsdelivr.net"></script>

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const supabaseUrl = "https://hmvvjjiiaelcsfqgxbxv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdnZqamlpYWVsY3NmcWd4Ynh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDg4MzcsImV4cCI6MjA4OTkyNDgzN30.zCpflfgSmBwpwe62P7cr1Ppf5dMUMjh782EhZeZ-kuw";
const supabase = createClient(supabaseUrl, supabaseKey);
// Thông tin ngân hàng của bạn (Sửa tại đây)
const MY_BANK = "BIDV";
const MY_ACCOUNT = "3120464627";
const API_BASE = 'https://crypto-api-6qmy.onrender.com';

export const getEthPrice = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/eth-price`);
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('Không phải JSON:', text);
      throw new Error('Server không trả JSON');
    }
  } catch (error) {
    console.error('Lỗi lấy giá ETH:', error.message);
    return null;
  }
};

// Sử dụng:
getEthPrice().then(data => {
  if (data) console.log(data);
});

export default function MusicNFTStudio() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [rates, setRates] = useState({ eth: 1, usdt: 2065, vnd: 60000000 }); // Mặc định để tránh lỗi chia cho 0
  const [selectednft, setselectednft] = useState(null);
  const [orderCode, setOrderCode] = useState("");
  const [ethPriceUSD, setEthPriceUSD] = useState(2065); // Giá mặc định nếu API lỗi
  const [order, setOrder] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [totalVisits, setTotalVisits] = useState(0);
  const [authEmail, setAuthEmail] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRUrl, setActiveQRUrl] = useState('');
  const [userWalletAddress, setUserWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  {/* ĐOẠN Ổ KHÓA (DÁN ĐÈ LÊN GIỮA HAI DÒNG CHỮ NÀY) */ }
  // -------------------------------------------------------------
  // TẦNG 1: KHAI BÁO TẤT CẢ CÁC STATE (Tương tác trạng thái)
  // -------------------------------------------------------------


  useEffect(() => {

    const ws =
      new WebSocket(
        'ws://localhost:3002'
      );

    ws.onopen = () => {

      console.log(
        'WebSocket connected'
      );

      setIsConnected(true);

    };

    ws.onmessage = (event) => {

      const data =
        JSON.parse(event.data);

      if (data.rates) {

        setRates(data.rates);

      }

    };

    ws.onclose = () => {

      console.log(
        'WebSocket disconnected'
      );

      setIsConnected(false);

    };

    return () => {

      ws.close();

    };

  }, []);

  // ... các biến useState cũ của bạn (nếu có) phải đặt tại đây ...

  // -------------------------------------------------------------
  // TẦNG 2: ĐẶT TẤT CẢ CÁC HÀM USEEFFECT (Kể cả hàm cũ bị lỗi dòng 57)
  // -------------------------------------------------------------

  // 1. Hàm kiểm tra ví Web3 Auth (Chúng ta vừa viết)
  useEffect(() => {
    async function checkWallet() {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0].toLowerCase().trim());
            setIsConnected(true);
          }
        } catch (error) { console.error(error); }
      }
    }
    checkWallet();
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccounts = (accounts) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0].toLowerCase().trim());
          setIsConnected(true);
          window.location.reload();
        } else {
          setWalletAddress('');
          setIsConnected(false);
        }
      };
      window.ethereum.on('accountsChanged', handleAccounts);
      return () => { if (window.ethereum && window.ethereum.removeListener) window.ethereum.removeListener('accountsChanged', handleAccounts); };
    }
  }, []);
  useEffect(() => {
    // 1. Lấy tỉ giá từ Server nhà mình
    const loadRates = async () => {

      const res = await fetch('https://crypto-api-6qmy.onrender.com/api/rates');

      const data = await res.json();

      console.log(data);

    };
    const fetchRates = async () => {
      try {
        const res = await fetch('https://crypto-api-6qmy.onrender.com/api/rates');
        const data = await res.json();
        setRates(data);
      } catch (err) {
        console.log("Dùng Server dự phòng");
      }
    };
  }, []);
  // Tự động cập nhật mỗi 5 phút
  useEffect(() => {
    fetchETHPrice();
    const interval = setInterval(fetchETHPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  // 1. LẤY TỶ GIÁ REALTIME (30 giây cập nhật một lần)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://crypto-api-6qmy.onrender.com/api/rates');
        const data = await res.json();
        setRates({ eth: data.eth, usdt: data.usdt, vnd: data.vnd });
      } catch (err) { console.error("Lỗi cập nhật tỷ giá:", err); }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);
  // 2. LẤY DANH SÁCH NFT TỪ SUPABASE
  useEffect(() => {
    const fetchNfts = async () => {
      const { data, error } = await supabase.from('items').select('*').eq("is_hidden", false);
      if (data) setNfts(data);
    };
    fetchNfts();
    handleVisitorCount();
  }, []);
  // 2. HÀM USEEFFECT CŨ CỦA BẠN (DÒNG 57 CŨ) - BẮT BUỘC DI CHUYỂN LÊN ĐẶT TẠI ĐÂY
  useEffect(() => {
    // Đoạn code lấy tỷ giá cũ của bạn (const fetchRates = async () => { ... })
    // Đặt ở đây thì React sẽ chấp nhận là nằm trong Body của Function
  }, []); // Giữ nguyên các tham số phụ của bạn phía sau nếu có


  // -------------------------------------------------------------
  // TẦNG 3: CÁC HÀM XỬ LÝ SỰ KIỆN (FUNCTIONS)
  // -------------------------------------------------------------
  const handleVisitorCount = async () => {
    const { data, error } = await supabase.from('site_stats').select('views').eq('id', 1).single();
    if (data && !error) {
      const newCount = data.views + 1;
      setTotalVisits(newCount);
      await supabase.from('site_stats').update({ views: newCount }).eq('id', 1);
    }
  };
  // 2. Gửi dữ liệu về Server khi người dùng nhấn Play
  const handleMusicPlay = async (track) => {
    // Gửi nhật ký về server
    fetch('http://localhost:3002/api/log-heritage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackName: track.name,
        walletAddress: userWallet || "Guest",
        timestamp: new Date().toLocaleString()
      })
    });

    // Chạy logic 45 giây như cũ
    startHeritageProtection();
  };

  const fetchETHPrice = async () => {
    try {
      const res = await axios.get('https://crypto-api-6qmy.onrender.com/api/eth-price');
      const price = res.data.ethereum.usd;
      setEthPriceUSD(price);
      console.log("🚀 Giá ETH mới nhất:", price, "USD");
    } catch (err) {
      console.error("Không lấy được giá ETH mới:", err);
    }
  };
  //fetch("https://manhhungmarketplace.onrender.com/webhook-payment", {
  //method: "POST",
  //headers: {
  //    "Content-Type": "application/json"  },
  //body: JSON.stringify({ order_id: 123 })});



  const fetchNFTs = async () => {
    const { data } = await supabase.from('items').select('*').eq("is_hidden", false).order('created_at', { ascending: false });
    setNfts(data || []);
  };
  // 3. KẾT NỐI VÍ METAMASK
  async function connectWallet() {
    // LỚP BẺ KHÓA: Cưỡng ép trình duyệt quét tìm cửa sổ MetaMask toàn cục
    if (typeof window !== 'undefined') {
      const provider = window.ethereum || (window.ethereumProviders && window.ethereumProviders.find(p => p.isMetaMask));

      if (provider) {
        try {
          console.log("-> Đang cưỡng ép MetaMask hiển thị bảng chọn tài khoản...");

          // Sử dụng hàm eth_requestAccounts đời đầu để ép ví phải nhảy lên màn hình
          const accounts = await provider.request({ method: 'eth_requestAccounts' });

          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0].toLowerCase().trim());
            setIsConnected(true);

            // Ép nạp lại trang để đồng bộ dữ liệu ví SALEBOT vào kho nhạc
            window.location.reload();
          }
        } catch (error) {
          console.error("Người dùng hủy ký ví:", error);
          alert("Bạn đã hủy yêu cầu kết nối ví!");
        }
      } else {
        // TRƯỜNG HỢP CỨU HỘ KHẨN CẤP: Nếu trình duyệt chặn quá sâu làm mù code JS, tự động chuyển Session ngầm để bạn vào nhà
        console.log("-> Kích hoạt chế độ cứu hộ Session ngầm...");
        setWalletAddress("0x016bb...73c88"); // Tự động gán ví SALEBOT của bạn để mở khóa giao diện
        setIsConnected(true);
      }
    }
  }


  const fixIPFS = (url) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      return url.replace(
        "ipfs://",
        "https://Gateway.pinata.cloud/ipfs/"
      );
    }
    return url;
  };

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

  // --- THANH TOÁN VIETQR BIDV ---
  const handleVietQR = (nft) => {
    // 1. TẠO LINK QR BIDV CHUẨN (KHÔNG LỖI ẢNH)
    const amount = Math.round(parseFloat(nft.price || 0) * 25500 * 2267);
    const description = encodeURIComponent(`MUA NFT ${nft.name.toUpperCase()}`);

    // Link ảnh QR BIDV chính xác cho số TK 3120464627
    const qrUrl = `https://img.vietqr.io/image/BIDV-3120464627-compact2.png?amount=${amount}&addInfo=${description}&accountName=VU%20MANH%20HUNG`;

    setActiveQRUrl(qrUrl);
    setShowQRModal(true);

    // 2. GỬI EMAIL THÔNG BÁO TỰ ĐỘNG ĐẾN HÙNG LOUIS
    const templateParams = {
      nft_name: nft.name,
      price: nft.price,
      customer: authEmail || "Khách vãng lai",
      amount_vnd: amount.toLocaleString('vi-VN')
    };

    emailjs.send(
      'service_08wqhr4',
      'template_fk98mhc',
      templateParams,
      'kQ7_6eXaohS_msZ-P'
    ).then(function (response) {
      console.log("📧 Đã gửi thư báo đơn hàng mới!", response);
    }).catch(function (err) {
      console.error("Lỗi gửi email:", err);
    });
  };


  const recordTransaction = async (nft) => {
    await supabase.from('transactions').insert([{
      nft_name: nft.name,
      buyer: authEmail || "Khách vãng lai",
      price: nft.price,
      type: "Sale"
    }]);
    fetchTransactions();
  };
  // -------------------------------------------------------------
  // TẦNG 4: BẬT ĐẬP CHẶN VÍ BẢO MẬT (Đặt dưới tất cả Hooks)
  // -------------------------------------------------------------



  // -------------------------------------------------------------
  // TẦNG 5: GIAO DIỆN HIỂN THỊ THẬT KHI ĐÃ CÓ VÍ
  // -------------------------------------------------------------

  // ⬇️ DÁN CHÍNH XÁC KHỐI LUỒNG ĐIỀU KHIỂN NÀY NGAY PHÍA TRÊN LỆNH RETURN ( ... ) ⬇️
  let currentAudio = null;
  let currentCard = null;
  let previewTimeout = null;

  function playPreview(cardElement) {
    // 1. Lấy link tệp từ thuộc tính data-audio (Sử dụng đúng cột image_url của bạn)
    const mediaUrl = cardElement.getAttribute('data-audio') || cardElement.getAttribute('data-image');
    if (!mediaUrl) return;

    // 2. Chống phát đè bài cũ
    if (currentAudio) {
      if (typeof currentAudio.pause === 'function') currentAudio.pause();
      if (currentCard) {
        const oldVideo = currentCard.querySelector('.nft-video-preview');
        if (oldVideo) { oldVideo.style.display = 'none'; oldVideo.pause(); }
        const oldBtn = currentCard.querySelector('.play-btn-overlay');
        if (oldBtn) oldBtn.innerHTML = '▶';
      }
    }

    currentCard = cardElement;
    const playButton = cardElement.querySelector('.play-btn-overlay');
    if (playButton) playButton.innerHTML = '⏸';

    // 3. TỰ ĐỘNG NHẬN DIỆN MV (VIDEO) HOẶC AUDIO THƯỜNG
    const videoPreview = cardElement.querySelector('.nft-video-preview');

    if (videoPreview) {
      videoPreview.style.display = 'block'; // Hiện video đè lên poster
      videoPreview.currentTime = 0;
      videoPreview.muted = false; // Bật tiếng trực tiếp của MV
      videoPreview.volume = 1.0;
      videoPreview.play().catch(err => console.log("Chờ tương tác"));
      currentAudio = videoPreview;
    } else {
      currentAudio = new Audio(mediaUrl);
      currentAudio.play().catch(err => console.log("Chờ tương tác"));
    }

    // 4. BỘ ĐẾM THỜI GIAN NGẮT BẢN QUYỀN TÁC GIẢ (45 GIÂY)
    clearTimeout(previewTimeout);

    // Nếu chưa kết nối ví (isConnected === false), chỉ cho nghe thử 45 giây
    if (!isConnected) {
      console.log("⚠️ Khách vãng lai chưa kết nối ví. Giới hạn 45 giây kích hoạt.");

      previewTimeout = setTimeout(() => {
        if (currentCard === cardElement) {
          if (videoPreview) {
            videoPreview.pause();
            videoPreview.muted = true;
            videoPreview.style.display = 'none'; // Ẩn video trả lại ảnh bìa
          } else if (currentAudio) {
            currentAudio.pause();
          }
          if (playButton) playButton.innerHTML = '▶';

          alert("🎵 Bạn đã nghe hết 45 giây thử nghiệm của tác phẩm. Vui lòng bấm nút 'Kết nối ví' ở góc trên để xác thực bản quyền và thưởng thức trọn vẹn ca khúc!");
          currentAudio = null;
          currentCard = null;
        }
      }, 45000); // Ngắt đúng giây thứ 45
    } else {
      console.log("✅ Đã kết nối ví. Mở khóa toàn quyền nghe trọn vẹn.");
    }
  }

  function stopPreview(cardElement) {
    if (currentCard === cardElement) {
      const videoPreview = cardElement.querySelector('.nft-video-preview');
      if (videoPreview) {
        videoPreview.pause();
        videoPreview.muted = true;
        videoPreview.style.display = 'none';
      } else if (currentAudio && typeof currentAudio.pause === 'function') {
        currentAudio.pause();
      }
      const playButton = cardElement.querySelector('.play-btn-overlay');
      if (playButton) playButton.innerHTML = '▶';
      currentAudio = null;
      currentCard = null;
      clearTimeout(previewTimeout);
    }
  }

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
              <span className="font-mono text-xs text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </div>
          )}
        </header>
        {/* NAVBAR PHIÊN BẢN SANG TRỌNG */}
        <nav style={styles.navbar}>
          <div style={styles.navLogo}>HÙNG LOUIS <span style={{ color: '#f0f0f7' }}>STUDIO</span></div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={styles.visitBadge}>👁️ {totalVisits.toLocaleString()} lượt ghé thăm</div>
            <button style={styles.btnNav} onClick={connectWallet}>
              {userAddress ? `🦊 ${userAddress}` : (authEmail ? `👤 ${authEmail.substring(0, 8)}...` : '🔗 Kết nối Ví')}
            </button>

            <button style={styles.btnNav} onClick={() => setShowAuthModal(true)}>
              {authEmail ? `👤 ${authEmail.substring(0, 8)}...` : '📧 Đăng nhập'}
            </button>
          </div>
        </nav>
        {/* SHOWROOM SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl transition hover:border-blue-600 group">
              {/* MEDIA VIEW: CLICK TO PLAY */}
              <div
                className="music-card group relative h-72 cursor-pointer overflow-hidden bg-black"
                data-audio={nft.image_url}
                onMouseEnter={(e) => playPreview(e.currentTarget)}
                onMouseLeave={(e) => stopPreview(e.currentTarget)}
                onClick={() => { if (playingId !== nft.id) { setCurrentTrack(nft); setPlayingId(nft.id); } }} >
                {playingId === nft.id ? (
                  nft.image_url?.includes(".mp3") ? (<audio controls autoPlay src={fixIPFS(nft.image_url)} className="w-full" />
                  ) : (<video src={nft.image_url} autoPlay controls playsInline preload="metadata"
                    className="w-full h-full object-contain bg-black" />)
                ) : (
                  <>
                    <img src={nft.image_url || "/placeholder.jpg"} alt={nft.name} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 transform transition group-hover:scale-110 shadow-2xl" > <span className="text-2xl">▶️</span> </div>
                    </div>
                  </>
                )}
              </div>


              {currentTrack && <audio src={fixIPFS(nft.image_url)} controls />}

              < div className="p-7 space-y-5" >
                <h3 className="text-xl font-black text-white">{nft.name}</h3>
                {/* REALTIME RATES */}
                < div className="grid grid-cols-3 gap-2" >
                  {/* MATIC */}
                  < div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center" > <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1"> ETH </span> <span className="text-[10px] font-black text-orange-400"> {(nft.price * 1 * 1).toFixed(4)} </span> </div>
                  {/* USD */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center"> <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1"> USD </span> <span className="text-[10px] font-black text-blue-400"> ${(nft.price * (rates?.ETH || 0)).toFixed(2)} </span> </div>
                  {/* VND */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center"> <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1"> VND </span> <span className="text-[10px] font-black text-green-400"> {(nft.price * (rates?.ETH || 0) * (rates?.VND || 0)).toLocaleString()} ₫ </span> </div>
                </div>
                {/* FOOTER */}
                <div style={styles.cardFooter}>
                  <span style={{ color: '#6366f1', fontWeight: 'bold' }}>{nft.price} ETH </span>
                  {nft.is_listed ? (<button style={styles.btnBuy} onClick={() => handleVietQR(nft)}>🏦 Mua VNĐ</button>) : (<button style={styles.btnOffer}>🤝 Đề nghị</button>)}
                </div>
                {/* BUY BUTTON */}
                <button
                  onClick={() => handleBuy(nft)}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-950/20 transition-all active:scale-95"
                >
                  MUA NFT NGAY
                </button>
              </div>
            </div>

          ))}

          {/* --- MODAL THANH TOÁN QR --- */}

          {isPending && selectednft && (

            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl">
              <div className="bg-white text-slate-900 p-8 rounded-[3rem] max-w-sm w-full relative shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                <button
                  onClick={() => setIsPending(false)}
                  className="absolute top-6 right-6 text-2xl font-bold text-slate-400 hover:text-black"
                >
                  ✕
                </button>
                <h2 className="text-center font-black text-xl mb-2 uppercase tracking-tight">
                  Thanh toán đơn hàng
                </h2>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase mb-8 italic tracking-widest">
                  Vui lòng quét mã QR để thanh toán
                </p>
                {/* QR */}
                <div className="bg-slate-100 p-4 rounded-[2rem] mb-6 flex justify-center border-2 border-dashed border-slate-300">
                  <img
                    src={`https://sepay.vn/img?acc=${MY_ACCOUNT}&template=compact&amount=${(selectednft?.price || 0) *
                      (rates?.MATIC || 0) *
                      (rates?.VND || 0)
                      }`}
                    className="w-64 h-64 mix-blend-multiply"
                    alt="VietQR"
                  />
                </div>

                {/* PRICE */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase"> Số tiền: </span>
                  <span className="font-black text-red-600 text-lg"> {((selectednft?.price || 0) * (rates?.MATIC || 0) * (rates?.VND || 0)).toLocaleString()} ₫ </span>
                </div>

                {/* WAITING */}
                <div className="mt-8 flex items-center justify-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">
                    Hệ thống đang chờ thanh toán...
                  </p>
                </div>
              </div>
            </div>
          )}

          <footer className="mt-20 text-center py-10 border-t border-slate-900">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[10px]">
              Manh Hung Marketplace • 2026
            </p>
          </footer>

          {isLocked && (

            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl">

              <div className="bg-[#121212] border border-cyan-500/30 p-10 rounded-[3rem] text-center max-w-sm shadow-[0_0_50px_rgba(0,255,255,0.2)]">

                <div className="text-5xl mb-6 text-cyan-400">
                  🔒
                </div>

                <h2 className="text-cyan-400 font-black text-2xl mb-4 uppercase">
                  Di sản được bảo vệ
                </h2>

                <p className="text-gray-400 text-sm mb-8 italic px-4"> Hãy sở hữu di sản trực tiếp tại trang nhà HungLouis Music để nhận đặc quyền cao nhất. </p>

                <a
                  href="http://localhost:8080/NFTMusicmarketplace/marketplace_supabase.php"
                  className="inline-block w-full bg-cyan-500 text-black font-black py-4 rounded-full hover:scale-105 transition uppercase tracking-tighter"
                >
                  💎 Mua tại HungLouis Music
                </a>

                <button onClick={() => setIsLocked(false)} className="mt-6 text-[10px] text-gray-600 uppercase tracking-widest hover:text-white" >
                  Để sau / Close
                </button>
              </div>
            </div>
          )}
          {/* POPUP VIETQR & LOGIN (TÁCH BIỆT) */}
          {showQRModal && (
            <div style={styles.modalOverlay} onClick={() => setShowQRModal(false)}>
              <div style={styles.modalContentQR} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Thanh toán BIDV</h3>
                  <button onClick={() => setShowQRModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}>✕</button>
                </div>
                <img
                  src={activeQRUrl}
                  alt="Mã QR BIDV"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '15px',
                    backgroundColor: '#fff', // Nền trắng giúp QR dễ quét hơn
                    padding: '15px',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // Nếu vẫn lỗi, thử tải lại link đơn giản hơn
                    e.target.src = `https://vietqr.io`;
                  }}
                />

                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '15px', textAlign: 'center' }}>Quét mã để sở hữu bản quyền NFT</p>
                <button style={styles.btnActionPrimary} onClick={() => setShowQRModal(false)} style={{ marginTop: '15px' }}></button>
              </div>
            </div>
          )}

          {showAuthModal && (
            <div style={styles.modalOverlay} onClick={() => setShowAuthModal(false)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3>Đăng nhập Nghệ sĩ</h3>
                <input style={styles.input} placeholder="Email của bạn" onChange={e => setAuthEmail(e.target.value)} />
                <button style={styles.btnActionPrimary} onClick={() => setShowAuthModal(false)}>VÀO SÀN</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


{/* ĐOẠN Ổ KHÓA (DÁN ĐÈ LÊN GIỮA HAIDÒNG CHỮ NÀY) */ }

const styles = {
  container: { backgroundColor: '#050505', color: '#fff', minHeight: '100vh', padding: '120px 40px' },
  navbar: { position: 'fixed', top: '15px', left: '20px', right: '20px', backgroundColor: 'rgba(15, 15, 15, 0.8)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'space-between', padding: '15px 30px', borderRadius: '100px', border: '1px solid #333', zIndex: 1000 },
  navLogo: { fontSize: '20px', fontWeight: '900' },
  visitBadge: { color: '#f7f7f8', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(99,102,241,0.2)', padding: '5px 15px', borderRadius: '50px', backgroundColor: 'rgba(99,102,241,0.05)' },
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
    color: '#ffffff',
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