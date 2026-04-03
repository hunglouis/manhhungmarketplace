'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { MY_COLLECTIONS } from './constants.js';
import axios from 'axios'; // Nhớ thêm dòng này ở đầu file page.js

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MusicNFTStudio() {
  const [status, setStatus] = useState('Sẵn sàng!');
  const [nfts, setNfts] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [nftData, setNftData] = useState({ name: '', desc: '', cid: '' });

  // Khởi tạo Audio khi chạy ở Client
  useEffect(() => {
    setAudioPlayer(new Audio());
    fetchNFTs();
  }, []);

  const fetchNFTs = async () => {
    try {
      const { data, error } = await supabase.from('hunglouis').select('*');
      if (error) throw error;
      setNfts(data || []);
    } catch (err) { console.error("Lỗi Fetch:", err.message); }
  };

  const syncAllCollections = async () => {
    try {
      setStatus('Đang quét dữ liệu...');
      const moralisKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
      let allData = [];
      for (const contractAddr of MY_COLLECTIONS) {
        const url = `https://deep-index.moralis.io${contractAddr}?chain=polygon&format=decimal`;
        const response = await fetch(url, { headers: { 'X-API-Key': moralisKey } });
        const result = await response.json();
        if (result.result) {
          const mapped = result.result.map(nft => {
            const meta = nft.metadata ? JSON.parse(nft.metadata) : {};
            return {
              name: meta.name || nft.name,
              audio_url: (meta.animation_url || "").replace(`ipfs://`, `https://ipfs.io`),
              image_url: (meta.image || "").replace(`ipfs://`, `https://ipfs.io`),
              token_id: nft.token_id,
              contract_address: contractAddr
            };
          });
          allData = [...allData, ...mapped];
        }
      }
      if (allData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "NFT_Data");
        XLSX.writeFile(workbook, "Danh_Sach_NFT_HungLouis.xlsx");
        setStatus('Thành công! Đã tải file Excel.');
      }
    } catch (err) { setStatus('Lỗi: ' + err.message); }
  };

  const togglePlay = (nft) => {
    const audioLink = nft.audio_url || `https://ipfs.io${nft.token_id}`;
    if (playingId === nft.id) {
      audioPlayer.pause();
      setPlayingId(null);
    } else {
      audioPlayer.src = audioLink;
      audioPlayer.play().catch(e => alert("Lỗi phát nhạc: " + e.message));
      setPlayingId(nft.id);
      audioPlayer.ontimeupdate = () => {
        if (audioPlayer.duration) setProgress((audioPlayer.currentTime / audioPlayer.duration) * 100);
      };
    }
  };

 const handleOneClick = async () => {
  // Lấy file đầu tiên từ danh sách (selectedFile là một mảng file)
  
  const fileToUpload = selectedFile; 
  console.log("File đang có là:", selectedFile);
  if (!selectedFile) {
	alert("Chưa chọn file bạn ơi!");
	return;
  }
   try {
    setStatus('🚀 Đang tải lên Pinata...');
    const formData = new FormData();
    formData.append('file', fileToUpload); // Đảm bảo selectedFile đã lấy từ .files[0]

   // Thay đổi dòng axios.post cũ bằng dòng này (PHẢI CÓ đoạn /pinning/pinFileToIPFS ở cuối)
const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_KEY.trim(),
    'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET.trim(),
  }
});

    const autoCID = res.data.IpfsHash;
    console.log("Mã CID nhận được:", autoCID);
    setStatus('✅ Đã có CID! Đang lưu vào Supabase...');

    // ... (phần lưu Supabase tiếp theo) ...
	// --- ĐOẠN NÀY LÀ PHẦN ĐẨY LÊN SUPABASE ---
    const { data, error } = await supabase
      .from('hunglouis') // Tên bảng của bạn
      .insert([
        { 
          name: nftData.name || "NFT mới của Hùng Louis", 
          description: nftData.desc || "Tải lên tự động bằng One-click",
          hunglouis_id: autoCID, // Lưu mã CID vừa nhận được vào đây
          image_url: `https://ipfs.io{autoCID}`, // Tạo link xem luôn
          artist: "Hùng Louis",
          created_at: new Date()
        }
      ]);

    if (error) {
        console.error("Lỗi Supabase:", error);
        throw error;
    }

    setStatus('🎉 THÀNH CÔNG! NFT đã lên kệ Supabase.');
    fetchNFTs(); // Tự động làm mới danh sách hiển thị phía dưới
    // ------------------------------------------
  } catch (err) {
  // Sửa dòng này để hiện lỗi cụ thể thay vì [object Object]
  setStatus('❌ Lỗi: ' + (err.response?.data?.error || err.message));
  console.log("Chi tiết lỗi:", err.response?.data);
  }
};




  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>Music NFT Studio - Hùng Louis</h1>
      <p>Trạng thái: <b style={{color: '#1db954'}}>{status}</b></p>
      
	  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{margin: '10px'}} />
		<button onClick={handleOneClick} style={{padding: '10px 25px', backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
		ONE-CLICK UPLOAD & SAVE
	</button>
	  
      {/* Phần Form Nhập NFT */}
      <div style={{ marginBottom: '30px', border: '1px solid #333', padding: '20px', borderRadius: '15px' }}>
        <input style={{margin: '5px', padding: '8px'}} placeholder="Tên NFT" onChange={e => setNftData({...nftData, name: e.target.value})} />
        <input style={{margin: '5px', padding: '8px'}} placeholder="Mô tả" onChange={e => setNftData({...nftData, desc: e.target.value})} />
        <input style={{margin: '5px', padding: '8px'}} placeholder="Dán CID" onChange={e => setNftData({...nftData, cid: e.target.value})} />
        <button onClick={handleOneClick} style={{padding: '8px 20px', cursor: 'pointer'}}>Mint & Lưu Supabase</button>
      </div>

      <button onClick={syncAllCollections} style={{ padding: '15px 30px', backgroundColor: '#5865F2', color: 'white', borderRadius: '30px', cursor: 'pointer', border: 'none', fontWeight: 'bold', marginBottom: '40px' }}>
        🔄 ĐỒNG BỘ & TẢI EXCEL
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
        {nfts.map((nft, index) => (
          <div key={nft.id|| index} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #333' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>{nft.name}</h3>
            <button onClick={() => togglePlay(nft)} style={{ padding: '8px 20px', backgroundColor: playingId === nft.id ? '#ff4d4d' : '#1db954', border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer' }}>
              {playingId === nft.id ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
