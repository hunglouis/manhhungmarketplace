import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// 1. Cấu hình Supabase (Lấy từ Project Settings > API)
const supabase = createClient('URL_SUPABASE_CỦA_BẠN', 'ANON_KEY_CỦA_BẠN');

export default function CreateNFT = () => {
  const [nftData, setNftData] = useState({ name: '', desc: '', cid: '' });

  const handleMintAndSave = async () => {
    try {
      // GIẢ SỬ: Bạn đã có CID từ bước upload ảnh/nhạc trước đó
      const bafkreignrhdn3avyfeu2lss3t7urqguyq3auusf3xgbjiajtxsvca3urjm = nftData.cid; 

      // 2. Gọi Smart Contract để Mint (Cần có contract instance ở đây)
      // const tx = await contract.mint(bafkreignrhdn3avyfeu2lss3t7urqguyq3auusf3xgbjiajtxsvca3urjm);
      // const receipt = await tx.wait();

      // 3. ĐÂY LÀ BƯỚC 2 BẠN HỎI: Dán nối tiếp sau khi Mint thành công
      // Giả sử receipt.status === 1 (thành công)
      const { data, error } = await supabase
        .from('hunglouis') // Tên bảng bạn tạo ở Bước 1
        .insert([
          { 
            name: nftData.name, 
            description: nftData.desc,
            image_url: `https://ipfs.io{bafkreignrhdn3avyfeu2lss3t7urqguyq3auusf3xgbjiajtxsvca3urjm}`, 
            owner_address: "0x..." // Địa chỉ ví người dùng
          }
        ]);

      if (error) throw error;
      alert("Đã lưu NFT lên Marketplace thành công!");

    } catch (err) {
      console.error("Lỗi rồi:", err);
    }
  };

  return (
    <div>
      <input placeholder="Tên NFT" onChange={e => setNftData({...nftData, name: e.target.value})} />
      <input placeholder="Mô tả" onChange={e => setNftData({...nftData, desc: e.target.value})} />
      <input placeholder="Dán CID vào đây" onChange={e => setNftData({...nftData, cid: e.target.value})} />
      <button onClick={handleMintAndSave}>Mint & Lưu Supabase</button>
    </div>
  );
};

export default CreateNFT ();
