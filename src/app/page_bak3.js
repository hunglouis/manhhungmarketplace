'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MusicNFTStudio() {
  const [status, setStatus] = useState('Hệ thống sẵn sàng');
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [nftData, setNftData] = useState({ name: '', desc: '', artist: 'Mạnh Hùng' });
  const [playingUrl, setPlayingUrl] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null); // Lưu toàn bộ thông tin NFT đang phát

  useEffect(() => { fetchNFTs(); }, []);

  const fetchNFTs = async () => {
    const { data } = await supabase.from('hunglouis').select('*').order('created_at', { ascending: false });
    setNfts(data || []);
  };

  const handleMintOneClick = async () => {
    if (!selectedFile || !nftData.name) return alert("Vui lòng nhập tên và chọn file!");
    
    setLoading(true);
    setStatus('🚀 Đang mã hóa và đẩy lên IPFS...');

    try {
      // 1. Upload lên Pinata
      const formData = new FormData();
      formData.append('file', selectedFile[0]);
      const res = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_KEY.trim(),
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET.trim(),
        }
      });

      const autoCID = res.data.IpfsHash;
      setStatus('✅ Đã có CID! Đang lưu vào Marketplace...');

      // 2. Lưu vào Supabase (Kết hợp Thủ công + Tự động)
      const { error } = await supabase.from('hunglouis').insert([{ 
          name: nftData.name, 
          description: nftData.desc,
          hunglouis_id: autoCID, 
          image_url:`https://gateway.pinata.cloud/ipfs/${autoCID}`,
          artist: nftData.artist,
          created_at: new Date()
      }]);

      if (error) throw error;
      setStatus('🎉 Phát hành NFT thành công!');
      setNftData({ name: '', desc: '', artist: 'Hùng Louis' });
      setSelectedFile(null);
      fetchNFTs();
    } catch (err) {
      setStatus('❌ Lỗi hệ thống: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.logo}>MUSIC <span style={{color: '#6366f1'}}>STUDIO</span></h1>
        <p style={styles.subtitle}>Nền tảng phát hành NFT âm nhạc của Hùng Louis</p>
      </header>

      {/* MINTING SECTION */}
      <section style={styles.mintSection}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Phát hành NFT mới</h2>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên bản nhạc</label>
            <input style={styles.input} type="text" placeholder="Ví dụ: Bản tình ca số 1" 
                   value={nftData.name} onChange={e => setNftData({...nftData, name: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mô tả câu chuyện</label>
            <textarea style={{...styles.input, height: '80px'}} placeholder="Kể về cảm hứng của bài hát..." 
                      value={nftData.desc} onChange={e => setNftData({...nftData, desc: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Chọn file âm thanh/ảnh</label>
            <input style={styles.fileInput} type="file" onChange={e => setSelectedFile(e.target.files)} />
          </div>

          <button onClick={handleMintOneClick} disabled={loading} style={loading ? styles.btnDisabled : styles.btnMint}>
            {loading ? 'Đang xử lý...' : 'PHÁT HÀNH NGAY (ONE-CLICK)'}
          </button>
          
          <p style={styles.statusText}>{status}</p>
        </div>
      </section>

      {/* MARKETPLACE SECTION */}
      <section style={styles.marketSection}>
        <h2 style={styles.sectionTitle}>Bộ sưu tập đã phát hành</h2>
        <div style={styles.grid}>
          
		  {nfts.map((nft) => (
            <div key={nft.id} style={styles.nftCard}>
              <div style={styles.imageBox}>
			  {/* NẾU ĐANG PHÁT: Hiện trình phát Video, NẾU KHÔNG: Hiện ảnh bìa */}
					{playingUrl === nft.image_url ? (
					<video 
						key={currentTrack.image_url} 
						src={currentTrack.image_url} 
						controls 
						autoPlay 
						playsInline // Thêm dòng này để hỗ trợ trên điện thoại
						style={styles.mainVideo}
					/>
				) : (
                 <img src={nft.image_url} style={styles.nftImage} alt="NFT Cover" />
				)}
			</div>
			
              <div style={styles.nftInfo}>
                <h4 style={styles.nftName}>{nft.name}</h4>
                <p style={styles.nftArtist}>By {nft.artist}</p>
                <div style={styles.nftFooter}>
                    <button 
						onClick={() => setCurrentTrack(nft)}
						style={styles.btnPlay}
					>
						{currentTrack?.id === nft.id ? '正在播放...' : '▶ Phát nhạc'}
					</button>	
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    {/* FIXED BOTTOM PLAYER */}
{currentTrack && (
  <div style={styles.fixedPlayer}>
    <div style={styles.playerContent}>
      {/* Nội dung thanh player của bạn */}
      <div style={styles.trackInfo}>
        <img src={currentTrack.image_url} style={styles.miniCover} alt="cover" />
        <div>
          <div style={styles.miniTitle}>{currentTrack.name}</div>
          <div style={styles.miniArtist}>{currentTrack.artist}</div>
        </div>
      </div>
      {/* Trình phát chính ở giữa */}
      <div style={styles.controls}>
        <video 
          key={currentTrack.image_url} // Để video tải lại khi đổi bài
          src={currentTrack.image_url} 
          controls 
          autoPlay 
		  playsInline // Thêm dòng này để hỗ trợ trên điện thoại
          style={styles.mainVideo}
        />
      </div>

      {/* Nút đóng bên phải */}
      <button onClick={() => setCurrentTrack(null)} style={styles.btnClose}>✕</button>
		{/* Nội dung thanh player của bạn */}
	</div>
  </div>
)}
</div>
);
}

// 2. HỆ THỐNG CSS CHUYÊN NGHIỆP (STYLE OBJECT)
const styles = {
  container: {
    backgroundColor: '#050505',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    padding: '40px 20px',
  },
  header: { textAlign: 'center', marginBottom: '60px' },
  logo: { fontSize: '36px', fontWeight: '900', letterSpacing: '-1px' },
  subtitle: { color: '#888', marginTop: '10px' },
  
  mintSection: { maxWidth: '600px', margin: '0 auto 80px' },
  card: {
    backgroundColor: '#111',
    padding: '40px',
    borderRadius: '24px',
    border: '1px solid #222',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  },
  cardTitle: { fontSize: '22px', marginBottom: '30px', fontWeight: '700' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: '500' },
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border 0.3s ease',
  },
  fileInput: { color: '#888', fontSize: '14px' },
  btnMint: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#6366f1',
    color: 'white',
    borderRadius: '14px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'transform 0.2s',
  },
  btnDisabled: { backgroundColor: '#333', cursor: 'not-allowed', width: '100%', padding: '16px', borderRadius: '14px', border: 'none' },
  statusText: { textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#6366f1' },

  marketSection: { maxWidth: '1200px', margin: '0 auto' },
  sectionTitle: { fontSize: '28px', marginBottom: '40px', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '30px' },
  nftCard: {
    backgroundColor: '#111',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid #222',
    transition: 'transform 0.3s ease',
  },
  imageBox: { width: '100%', aspectRatio: '1/1', backgroundColor: '#222' },
  nftImage: { width: '100%', height: '100%', objectFit: 'cover' },
  nftInfo: { padding: '20px' },
  nftName: { fontSize: '17px', fontWeight: '700', margin: '0 0 5px' },
  nftArtist: { fontSize: '13px', color: '#888', marginBottom: '15px' },
  nftFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceTag: { fontSize: '12px', backgroundColor: '#1a1a1a', padding: '4px 10px', borderRadius: '6px', color: '#6366f1' },
  btnPlay: { backgroundColor: 'transparent', border: '1px solid #333', color: '#fff', padding: '6px 15px', borderRadius: '10px', cursor: 'pointer' },
    fixedPlayer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    backdropFilter: 'blur(15px)',
    borderTop: '1px solid #333',
    padding: '15px 20px',
    zIndex: 1000,
    boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
  },
  playerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },
  trackInfo: { display: 'flex', alignItems: 'center', gap: '15px', flex: 1 },
  miniCover: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' },
  miniTitle: { fontSize: '14px', fontWeight: '700', color: '#fff' },
  miniArtist: { fontSize: '12px', color: '#888' },
  controls: { flex: 2, display: 'flex', justifyContent: 'center' },
  mainVideo: { height: '60px', borderRadius: '8px', backgroundColor: '#000' },
  btnClose: { backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', padding: '0 10px' },
  };

