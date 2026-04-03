'use client';
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// 1. CẤU HÌNH HỆ THỐNG
const SMARTCONTRACT_ADDRESS = "0xdde62b6454e09c2d9ee759d7d3926508efef44b7";
const PLATFORM_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MusicNFTStudio() {
    // --- STATES ---
    const [ethPriceUSD, setEthPriceUSD] = useState(2065); // Giá mặc định nếu API lỗi
	const [order, setOrder] = useState(null);
    const [nfts, setNfts] = useState([]);
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

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const address = accounts[0];
                setUserWalletAddress(`${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
                setAuthEmail(address);
            } catch (err) {
                console.error("Lỗi kết nối ví:", err);
            }
        } else {
            alert("Vui lòng cài đặt MetaMask!");
        }
    };

    // HÀM XỬ LÝ MUA HÀNG & HIỆN QR
    const handleBuyNFT = async (nft) => {
        try {
            const paymentContent = `MH${Math.floor(100000 + Math.random() * 900000)}`;
            const amountVND = Math.round(parseFloat(nft.price) * ethPriceUSD * 25500);

            // 1. Lưu đơn hàng
            const { data, error } = await supabase
                .from('order')
                .insert([{
                    nft_id: nft.id,
                    buyer_address: userWalletAddress,
                    amount: amountVND,
                    payment_content: paymentContent,
                    status: 'pending'
                }])
                .select().single();

            if (error) throw error;

            // 2. Tạo Link VietQR chuẩn
            const MY_BANK = "BIDV";
            const MY_ACC = "3120464627";
            const qrUrl = `https://vietqr.io{amountVND}&addInfo=${paymentContent}&accountName=NGUYEN%20MANH%20HUNG`;


            setOrder(data);
            setActiveQRUrl(qrUrl);
            setShowQRModal(true);

        } catch (err) {
            console.error("Lỗi mua hàng:", err);
            alert("Có lỗi xảy ra khi tạo đơn hàng.");
        }
    };

    // --- GIAO DIỆN (PHẦN QUAN TRỌNG NHẤT) ---
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>ManhHung Marketplace</h1>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                {!userWalletAddress ? (
                    <button onClick={connectWallet} style={styles.button}>Kết nối ví Metamask</button>
                ) : (
                    <p>Ví của bạn: <b>{userWalletAddress}</b></p>
                )}
            </div>

            {/* DANH SÁCH NFT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {nfts.map((nft) => (
                    <div key={nft.id} style={styles.card}>
                        <img src={nft.image_url} alt={nft.name} style={{ width: '100%', borderRadius: '8px' }} />
                        <h3>{nft.name}</h3>
                        <p>Giá: {nft.price} ETH (~{(nft.price * ethPriceUSD * 25500).toLocaleString()} VNĐ)</p>
                        <button onClick={() => handleBuyNFT(nft)} style={styles.buyButton}>Mua bằng VNĐ (VietQR)</button>
                    </div>
                ))}
            </div>

            {/* MODAL HIỆN MÃ QR */}
            {showQRModal && (
                <div style={styles.modalOverlay} onClick={() => setShowQRModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3>Thanh toán BIDV</h3>
                            <button onClick={() => setShowQRModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <img src={activeQRUrl} alt="QR Code" style={{ width: '100%', maxWidth: '250px' }} />
                            <p style={{ marginTop: '10px', fontWeight: 'bold', color: '#d32f2f' }}>
                                Số tiền: {order?.amount.toLocaleString()} VNĐ
                            </p>
                            <p style={{ fontSize: '12px', color: '#666' }}>Nội dung: {order?.payment_content}</p>
                        </div>
                        <p style={{ fontSize: '13px', textAlign: 'center', fontStyle: 'italic' }}>
                            Vui lòng không thay đổi nội dung chuyển khoản để hệ thống tự động nhận diện.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- HỆ THỐNG STYLES - BẢN GỐC ---
const styles = {
    button: { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    card: { backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    buyButton: { width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' },
    // Dòng 365 của bạn sẽ nằm ở đây, hãy đảm bảo có dấu phẩy ở cuối dòng buyButton phía trên
    modalOverlay: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000 
    },
    modalContent: { 
        backgroundColor: '#fff', 
        padding: '25px', 
        borderRadius: '15px', 
        width: '90%', 
        maxWidth: '400px' 
    }
};


