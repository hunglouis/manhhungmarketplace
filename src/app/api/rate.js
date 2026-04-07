import axios from 'axios'; 
// Hoặc nếu dùng script tag ở HTML thì thêm:
// <script src="https://jsdelivr.net"></script>

export default async function handler(req, res) {
  try {
    // Gọi đến CoinGecko từ server (Server không bị chặn CORS)
    const response = await fetch('https://coingecko.com');
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tỉ giá' });
  }
}
