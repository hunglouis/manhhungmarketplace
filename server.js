import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import cors from 'cors';


// Khởi tạo cấu hình
dotenv.config();
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// 1. API Cung cấp tỉ giá (Hết lỗi 404 trên Studio)
app.get('/api/rates', (req, res) => {
    res.json({ eth: 3500, usdt: 1, vnd: 25400 });
    // Sửa lại để khớp hoàn toàn với Studio
    app.get('/api/eth-price', (req, res) => {
        res.json({
            ethereum: { usd: 3500 }, // Studio đang tìm cái 'usd' nằm trong 'ethereum'
            tether: { usd: 1 },
            vnd: 25400
        });
    });

});

// 2. API Ghi nhật ký người nghe (Dữ liệu di sản quý báu)
app.post('/api/log-heritage', (req, res) => {
    const { trackName, walletAddress, timestamp } = req.body;
    const logEntry = `[${timestamp}] Ví: ${walletAddress || 'Khách vãng lai'} - Đã nghe: ${trackName}\n`;

    fs.appendFile('nhat-ky-di-san.txt', logEntry, (err) => {
        if (err) {
            console.error("Lỗi ghi file:", err);
            return res.status(500).json({ error: "Lỗi lưu dữ liệu" });
        }
        console.log(`✅ Ghi nhận lượt nghe: ${trackName}`);
        res.json({ status: "Success", message: "Đã lưu nhật ký di sản" });
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀--------------------------------------------------`);
    console.log(`   HUNGLOUIS SERVER ĐANG CHẠY TẠI CỔNG ${PORT}`);
    console.log(`   Hệ thống Nhật ký Di sản đã sẵn sàng!`);
    console.log(`--------------------------------------------------\n`);
});
