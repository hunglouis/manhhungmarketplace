"use client";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import CryptoTable from '../components/CryptoTable';
import { useEffect, useState } from 'react';
//import './style.css'; // Import trực tiếp file css vừa tạo


let currentAudio = null;
let currentCard = null;
let previewTimeout = null;


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

export default function MusicNFTStudio() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [nfts, setNfts] = useState([]);
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
  const [rates, setRates] = useState({ eth: "3,150.00", vnd: "25,400.00" });
  const [lastUpdated, setLastUpdated] = useState("Đang kết nối...");
  const [isFullVersion, setIsFullVersion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioSource, setAudioSource] = useState("");
  const [ratesChannel, setRatesChannel] = useState(null);

  async function handleRequestFullAudio(nft) {

    if (!window.ethereum) {
      return alert("Vui lòng cài đặt ví MetaMask để xác thực quyền sở hữu!");
    }
    setLoading(true);

    // 1. Kết nối và lấy thông tin ví người dùng
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userWallet = await signer.getAddress(); // Đổi tên ở đây

    // 2. Tạo thông điệp ký bảo mật (kèm timestamp chống tấn công phát lại)
    const timestamp = Date.now();
    const message = `Xac thuc quyen so huu NFT de mo khoa ban Full.\nToken ID: ${nft.tokenId}\nVí: ${walletAddress}\nThời gian: ${timestamp}`;

    // 3. Yêu cầu ký số (Không tốn gas)
    const signature = await signer.signMessage(message);

    // 3. Gửi lên Server Render (Sửa walletAddress thành userWallet)
    const RENDER_BACKEND_URL = "https://crypto-api-backend-2url.onrender.com";
    const response = await fetch(`${RENDER_BACKEND_URL}/api/access-full-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: userWallet, // Truyền biến userWallet vào đây
        signature,
        message,
        token_id: String(""),
        item_id: String("")
      })
    });

    // 1. Tiếp nhận luồng dữ liệu nhị phân (Blob Stream) an toàn từ server
    const audioBlob = await response.blob();

    // Kiểm tra nếu dung lượng Blob tải về quá nhỏ (hỏng file ngầm)
    if (audioBlob.size < 100) {
      return alert("⚠️ Lỗi: Server trả về tệp trống hoặc link gốc bị hỏng.");
    }
    setLoading(false);

    const secureAudioUrl = URL.createObjectURL(audioBlob);

    // 2. Cập nhật nguồn phát mới và giải phóng giao diện xoay chờ
    setAudioSource(secureAudioUrl);
    setIsFullVersion(true);
    setLoading(false); // ✅ QUAN TRỌNG: Tắt trạng thái "Đang xác thực ví..." ở đây!

    alert("🎉 Xác thực sở hữu ví thành công! Đang kích hoạt phát bản FULL...");

    // 3. Ép trình phát nhạc nạp lại đĩa từ bộ nhớ tạm Blob vừa tạo
    setTimeout(() => {

      // Hãy đảm bảo ID của thẻ audio trùng khớp với ID bạn đặt dưới phần return
      const audioElement = document.getElementById(`audio-player-${item.id}`);
      if (audioElement) {
        audioElement.load();  // Nạp nguồn nhạc mới
        audioElement.play().catch(e => {
          console.log("Trình duyệt chặn tự động phát, người dùng cần bấm nút Play:", e.message);
        });
      }
    }, 300);
  };
  const getEthPrice = async () => {
    try {
      const res = await fetch(`https://${API_BASE}/api/ethPrice`);
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
  })



  function NFTCard({ item }) {
    const [loading, setLoading] = useState(false);
    const [audioSource, setAudioSource] = useState(item.previewURL); // Mặc định chạy bản Preview
    const [isFullVersion, setIsFullVersion] = useState(false);

  }

  {/* ĐOẠN Ổ KHÓA (DÁN ĐÈ LÊN GIỮA HAI DÒNG CHỮ NÀY) */ }
  // -------------------------------------------------------------
  // TẦNG 1: KHAI BÁO TẤT CẢ CÁC STATE (Tương tác trạng thái)
  // -------------------------------------------------------------
  // Hàm kiểm tra xem người dùng hiện tại có phải là CHÍNH CHỦ của NFT hay không
  // DÁN HÀM KIỂM TRA CHÍNH CHỦ VÀO NGAY ĐÂY (PHẦN ĐẦU HÀM CHÍNH)
  function checkIsChinhChu(nftObject) {
    if (!isConnected || !userWalletAddress || !nftObject || !nftObject.owner_wallet_address) {
      return false; // Không kết nối ví, hoặc thiếu thông tin -> Mặc định là KHÔNG PHẢI CHÍNH CHỦ
    }
    // So sánh 2 địa chỉ ví (ép về chữ thường để tránh lỗi ký tự hoa-thường)
    return userWalletAddress.toLowerCase() === nftObject.owner_wallet_address.toLowerCase();
  }
  // ========================================================
  // HÀM ĐẶC QUYỀN CHO CREATOR VÀ OWNER: Nếu là creator hoặc owner của NFT, cho phép nghe không giới hạn thời gian
  // ========================================================
  function checkHasFullAccess(nftObject) {
    if (!isConnected || !userWalletAddress || !nftObject) {
      return { hasAccess: false, reason: "GUEST" };
    }
    const currentWallet = userWalletAddress.toLowerCase();
    const creatorWallet = nftObject.creator_address?.toLowerCase();
    const ownerWallet = nftObject.owner_address?.toLowerCase();

    if (currentWallet === creatorWallet) return { hasAccess: true, reason: "CREATOR" };
    if (currentWallet === ownerWallet) return { hasAccess: true, reason: "OWNER" };

    return { hasAccess: false, reason: "NO_RIGHTS" };
  }

  // Tự động mở khóa quyền âm thanh hệ thống ngay từ cú tương tác đầu tiên của người dùng
  useEffect(() => {
    // 1. Định nghĩa hàm mở khóa trực tiếp trong useEffect để tránh lỗi scope
    const unlockAudioContext = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
        }
      } catch (e) {
        console.log("Không thể khởi tạo AudioContext:", e.message);
      }
    }

    // Hàm trung gian xử lý sự kiện
    const handleFirstUserInteraction = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      window.removeEventListener('scroll', handleFirstUserInteraction);
      // Lắng nghe tất cả các hành động tương tác phổ biến của người dùng
      window.addEventListener('click', handleFirstUserInteraction);
      window.addEventListener('touchstart', handleFirstUserInteraction); // Dành cho điện thoại
      window.addEventListener('scroll', handleFirstUserInteraction);     // Dành cho hành động cuộn trang
      // Hàm dọn dẹp (cleanup) khi hợp phần bị hủy
      return () => {
        window.removeEventListener('click', handleFirstUserInteraction);
        window.removeEventListener('touchstart', handleFirstUserInteraction);
        window.removeEventListener('scroll', handleFirstUserInteraction);
      }
    };

  }, []);


  useEffect(() => {
    // 1. Hàm lấy dữ liệu lần đầu tiên khi vừa tải trang
    const fetchInitialRates = async () => {
      const { data, error } = await supabase
        .from('crypto_rates')
        .select('*')
        .eq('id', 1)
        .single();

      if (data && !error) {
        updateRatesState(data);
      }
    };
  }, []);
  useEffect(() => {
    // Hàm phụ để Format định dạng số hiển thị ra màn hình
    const updateRatesState = (data) => {
      setRates({
        eth: Number(data.eth_price).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        vnd: Number(data.vnd_rate).toLocaleString('vi-VN')
      });
      const now = new Date(data.updated_at).toLocaleTimeString('vi-VN');
      setLastUpdated(now);
      fetchInitialRates();
    };
  }, []);

  useEffect(() => {
    // 2. KÍCH HOẠT LẮNG NGHE REALTIME: Cứ bảng 'crypto_rates' có UPDATE là cập nhật giao diện lập tức
    const ratesChannel = supabase
      .channel('realtime-rates')
      .on(
        'postgres_changes', // Tham số đầu tiên bắt buộc phải là chuỗi này
        { event: 'UPDATE', schema: 'public', table: 'rates' }, // Điền tên bảng của bạn thay cho 'rates' nếu khác
        (payload) => {
          console.log('Dữ liệu thay đổi:', payload);
          updateRatesState(payload.new);
        }
      )
      .subscribe();

    // Hủy kết nối lắng nghe khi người dùng tắt trang web để tránh tốn tài nguyên
    return () => {
      supabase.removeChannel(ratesChannel);
    };
  }, []); // Đảm bảo có mảng phụ thuộc trống [] ở đây

  // 2. LẤY DANH SÁCH NFT TỪ SUPABASE
  useEffect(() => {
    const fetchNfts = async () => { const { data, error } = await supabase.from('items').select('*').eq("is_hidden", false); if (data) setNfts(data); };
    fetchNfts();
    handleVisitorCount();
  }, []);

  // 2. HÀM USEEFFECT CŨ CỦA BẠN (DÒNG 57 CŨ) - BẮT BUỘC DI CHUYỂN LÊN ĐẶT TẠI ĐÂY
  useEffect(() => {

  }, []);

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
      const res = await axios.get('http://localhost:3002/api/rates/');
      const price = res.data.ethereum.usd;
      setEthPriceUSD(price);
      console.log("🚀 Giá ETH mới nhất:", price, "USD");
    } catch (err) {
      console.error("Không lấy được giá ETH mới:", err);
    }
  };

  const fetchNFTs = async () => {
    const { data } = await supabase.from('items').select('*').eq("is_hidden", false).order('created_at', { ascending: false });
    setNfts(data || []);
  };

  // 3. KẾT NỐI VÍ METAMASK
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 1. Yêu cầu kết nối ví MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];

        // 2. Rút gọn địa chỉ ví để hiển thị đẹp (ví dụ: 0x1234...abcd)
        const shortenedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        setUserAddress(shortenedAddress);
        setWalletAddress(address);

        // 3. Ghi nhận email/ví vào hệ thống
        setAuthEmail(address);
        console.log("💎 Đã kết nối ví:", address);
      } catch (err) {
        console.error("Lỗi kết nối ví:", err);
      }
    } else {
      alert("Vui lòng cài đặt MetaMask để dùng tính năng này!");
      // TRƯỜNG HỢP CỨU HỘ KHẨN CẤP: Nếu trình duyệt chặn quá sâu làm mù code JS, tự động chuyển Session ngầm để bạn vào nhà
      console.log("-> Kích hoạt chế độ cứu hộ Session ngầm...");
      setWalletAddress("0x016bb...73c88"); // Tự động gán ví SALEBOT của bạn để mở khóa giao diện
      setIsConnected(true);

    }

  };

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


  // ĐOẠN CODE CẬP NHẬT MỚI TOÀN DIỆN CHO 3 HÀM ĐIỀU KHIỂN
  let previewTimeout = null;
  let currentActiveAudio = null; // Biến lưu player duy nhất đang phát trên toàn trang

  function forceStopEverything() {
    clearTimeout(previewTimeout);

    // 1. Tắt đồng hồ đếm ngược
    const banner = document.getElementById('copyright-timer-banner');
    if (banner) banner.style.display = 'none';

    // 2. Dừng player đang phát hiện tại dứt khoát trước khi chuyển bài
    if (currentActiveAudio) {
      try {
        currentActiveAudio.pause();
        currentActiveAudio.ontimeupdate = null; // Xóa bộ giám sát thời gian của bài cũ
      } catch (e) { console.log(e); }
      currentActiveAudio = null;
    }
  }

  // Hàm xử lý khi DI CHUỘT VÀO CARD
  function playPreview(cardElement) {
    // Tìm thẻ audio đầy đủ tính năng đang nằm trên chính chiếc Card này
    const localAudio = cardElement.querySelector('audio');
    if (!localAudio) return;

    // Nếu di chuột qua lại trên bài ĐANG PHÁT thì giữ nguyên, không khởi động lại
    if (currentActiveAudio === localAudio && !localAudio.paused) return;

    // Dừng bài cũ đang phát ở chỗ khác ngay lập tức (Đáp ứng yêu cầu: Tại một thời điểm chỉ có 1 bài hát)
    forceStopEverything();

    // Đánh dấu đây là player duy nhất được quyền hoạt động hiện tại
    currentActiveAudio = localAudio;
    localAudio.currentTime = 0;
    localAudio.play().catch(err => console.log("Chờ tương tác chuột"));

    // Lấy quyền ví từ thuộc tính của Card để kiểm tra tiên đề Chính chủ
    const nftOwnerAddress = cardElement.getAttribute('data-owner') || "";
    const currentNftData = { owner_wallet_address: nftOwnerAddress };
    const accessControl = checkHasFullAccess(currentNftData);

    // KÍCH HOẠT CHẶN BẢN QUYỀN 45 GIÂY CHO KHÁCH HOẶC VÍ KHÔNG CHÍNH CHỦ
    if (!accessControl.hasAccess) {
      const banner = document.getElementById('copyright-timer-banner');
      const circleBox = document.getElementById('timer-circle-box');
      const bTitle = document.getElementById('timer-banner-title');
      const bDesc = document.getElementById('timer-banner-desc');

      if (banner && circleBox && bTitle && bDesc) {
        banner.style.display = 'block';
        banner.style.borderColor = 'rgba(6, 182, 212, 0.3)';
        circleBox.innerHTML = '45';
        bTitle.innerHTML = 'Đang nghe thử bản quyền';
        bDesc.innerHTML = 'Player đầy đủ tính năng đang bị giới hạn 45 giây.';
      }

      // Giám sát thời gian thực của CHÍNH cái player hiển thị trên màn hình
      // 1. SỬA CHỮU HOA THÀNH CHỮ THƯỜNG: ontimeupdate
      localAudio.ontimeupdate = function () {
        // Tính thời gian còn lại (Đếm ngược từ 45 giây)
        const timeLeft = Math.max(0, Math.ceil(45 - localAudio.currentTime));

        // Cập nhật số giây nhảy trên màn hình
        if (circleBox && localAudio.currentTime < 45) {
          circleBox.innerHTML = timeLeft;
        }

        // KHÓA CỨNG Ở GIÂY 45
        if (localAudio.currentTime >= 45) {
          localAudio.pause();
          localAudio.currentTime = 45; // Khóa chặt không cho nghe tiếp
          localAudio.ontimeupdate = null; // Tắt bộ đếm để tránh lặp vô hạn

          if (banner && circleBox && bTitle && bDesc) {
            banner.style.borderColor = '#ef4444';
            circleBox.innerHTML = 'X';
            circleBox.style.borderColor = '#ef4444';
            circleBox.style.color = '#ef4444';
            bTitle.innerHTML = 'Hết thời gian nghe thử!';
            bDesc.innerHTML = 'Chỉ ví sở hữu <b>Chính chủ</b> mới được mở khóa nghe full trên player.';
          }
        }
      };
    } else {
      // NẾU LÀ VÍ CHÍNH CHỦ: Không gắn ontimeupdate, player mở khóa hoàn toàn để chủ sở hữu nghe full bài, tua nhạc tùy ý!
      console.log("✅ Chính chủ xác thực thành công. Player đã được mở khóa toàn bộ tính năng!");
    }
  }
  // Hàm xử lý khi RÊ CHUỘT RA NGOÀI CARD
  function stopPreview(cardElement) {
    const localAudio = cardElement.querySelector('audio');
    // Khi rời chuột, nếu bài này đang phát thì tắt đi
    if (currentActiveAudio === localAudio) {
      forceStopEverything();
    }
  }



  return (

    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-10 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `audio, audio::-webkit-media-controls-enclosure, audio::-webkit-media-controls-panel { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0px !important; width: 0px !important; max-height: 0px !important; max-width: 0px !important; position: absolute !important; top: -9999px !important; left: -9999px !important; pointer-events: none !important; }` }} />
      <div className="max-w-7xl mx-auto">

        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between nfts-center mb-12 gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
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

          {/* HỘP TỈ GIÁ */}
          <div
            style={{
              padding: '15px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontFamily: 'monospace',
              maxWidth: '350px',
              margin: '5px 0'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '5px'
              }}
            >
              <span
                style={{
                  height: '10px',
                  width: '10px',
                  backgroundColor: lastUpdated ? '#00ff00' : '#ff0000',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginRight: '8px',
                  boxShadow: lastUpdated ? '0 0 8px #00ff00' : 'none'
                }}
              ></span>

              <b style={{ fontSize: '14px', color: '#00ff00' }}>
                BINANCE REALTIME RATES
              </b>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <p>🔹 <b>ETH/USDT:</b> ${rates.eth}</p>
              <p>🔹 <b>USDT/VND:</b> {rates.vnd} đ</p>
              <p>
                🔹 <b>Cập nhật cuối:</b>
                <span style={{ color: '#ffea00' }}>
                  {lastUpdated}
                </span>
              </p>
            </div>

          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
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
              <div className="nft-card border p-4 rounded-xl bg-slate-900 text-white">
                {/* 1. Tiêu đề & Trạng thái bản nhạc */}
                <h3 className="text-xl font-bold">{nft.name}</h3>
                <p className="text-sm text-gray-400">
                  Trạng thái: {isFullVersion ? "🟢 Đang phát bản FULL" : "🟡 Đang phát bản Preview (Thử nghiệm)"}
                </p>
                <div
                  className="music-card group relative h-72 cursor-pointer overflow-hidden bg-black"
                  data-audio={nft.fullAudioURL}
                  data-owner={nft.owner_address} // <-- BẮT BUỘC PHẢI CÓ DÒNG NÀY
                  onMouseEnter={(e) => playPreview(e.currentTarget)}
                  onMouseLeave={(e) => stopPreview(e.currentTarget)}
                  onClick={() => { if (playingId !== nft.id) { setCurrentTrack(nft); setPlayingId(nft.id); } }} >
                  {playingId === nft.id ? (
                    nft.fullAudioURL?.includes(".mp3") ? (
                      <audio
                        id={`audio-player-${nft.id}`}
                        muted={false} // 🌟 Bắt buộc phải có dòng này để phá vỡ lệnh cấm của trình duyệt
                        loop={true}  // Giúp nhạc lặp lại mượt mà khi hover liên tục
                        src={nft.previewURL}
                        onTimeUpdate={(e) => {
                          const audioEl = e.currentTarget;
                          const isChinhChu = checkIsChinhChu(currentTrack);
                          if (!isChinhChu && audioEl.currentTime >= 45) {
                            // 1. Khóa cứng và dừng nhạc ngay lập tức
                            audioEl.pause();
                            audioEl.currentTime = 45;
                            // 2. Tắt trạng thái đang phát trên giao diện
                            setPlayingId(null);
                            // 3. Hiển thị thông báo bản quyền (Có thể gọi bảng banner đếm ngược đổi sang màu đỏ)
                            const banner = document.getElementById('copyright-timer-banner');
                            const circleBox = document.getElementById('timer-circle-box');
                            const bTitle = document.getElementById('timer-banner-title');
                            const bDesc = document.getElementById('timer-banner-desc');
                            if (banner && circleBox && bTitle && bDesc) { banner.style.display = 'block'; banner.style.borderColor = '#ef4444'; circleBox.innerHTML = '✕'; circleBox.style.borderColor = '#ef4444'; circleBox.style.color = '#ef4444'; bTitle.innerHTML = 'Giới hạn bản quyền 45 giây!'; bDesc.innerHTML = isConnected ? 'Ví của bạn không sở hữu vật phẩm này. Vui lòng mua NFT để nghe trọn vẹn.' : 'Vui lòng kết nối ví <b>Chính chủ</b> để nghe toàn bộ bài hát.'; }
                          }
                        }}
                        autoPlay src={fixIPFS(nft.previewURL)} className="w-full" controls />
                    ) : (<video src={nft.previewURL} autoPlay controls playsInline preload="metadata"
                      className="w-full h-full object-contain bg-black" />)
                  ) : (
                    <>
                      <img src={nft.previewURL || '/placeholder.png'} alt={nft.name} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 transform transition group-hover:scale-110 shadow-2xl" > <span className="text-2xl">▶️</span> </div>
                      </div>
                    </>
                  )}
                </div>
                {/* 3. Khu vực tương tác nút bấm */}
                <div className="flex gap-2">
                  {!isFullVersion && (
                    <button
                      onClick={() => handleRequestFullAudio(nft)}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition-all"
                    >
                      {loading ? "⌛ Đang xác thực ví..." : "🔒 Nghe Bản FULL (Creator/Owner)"}
                    </button>
                  )}

                  {isFullVersion && (
                    <button
                      onClick={() => {
                        setAudioSource(nft.previewURL);
                        setIsFullVersion(false);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      Quay lại bản Preview
                    </button>
                  )}
                </div>
              </div>



              {currentTrack && <audio src={fixIPFS(nft.fullAudioURL)} controls />}

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
                <button style={styles.btnActionPrimary} onClick={() => setShowQRModal(false)}></button>
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

      {/* BẢNG ĐỒNG HỒ ĐẾM NGƯỢC VÀ THÔNG BÁO (Bảo mật bản quyền) */}
      <div id="copyright-timer-banner" style={{ display: 'none', position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '20px', padding: '20px', width: '320px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontFamily: "'Inter', sans-serif", transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Vòng tròn đếm số */}
          <div id="timer-circle-box" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '3px solid #00ffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#00ffff', fontSize: '18px', boxShadow: '0 0 15px rgba(0,255,255,0.4)' }}>
            45
          </div>
          {/* Nội dung chữ */}
          <div style={{ flexGrow: 1 }}>
            <h4 id="timer-banner-title" style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>Đang nghe thử bản quyền</h4>
            <p id="timer-banner-desc" style={{ margin: '3px 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>Kết nối ví để mở khóa toàn bộ tác phẩm.</p>
          </div>
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

}
