'use client';
import { useEffect, useState } from 'react';

export default function CryptoTable() {
    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrices() {
            try {
                const res = await fetch('/api/crypto-prices');
                const json = await res.json();
                if (json.success) {
                    setCryptoData(json.data);
                }
            } catch (err) {
                console.error('Không thể tải tỉ giá:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPrices();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8 text-slate-500 animate-pulse">
                🔄 Đang tải tỉ giá thị trường...
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto my-6 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-bold text-lg tracking-wide">📊 Tỉ Giá Crypto Realtime</h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-medium animate-pulse">
                    Auto Save
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <th className="px-6 py-3">Tên Coin</th>
                            <th className="px-6 py-3 text-right">Giá (USD)</th>
                            <th className="px-6 py-3 text-right">Giá (VND)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {cryptoData.map((coin) => (
                            <tr key={coin.coin_id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded font-bold">
                                        {coin.symbol}
                                    </span>
                                    <span className="capitalize text-slate-500 font-normal">{coin.coin_id}</span>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                                    ${coin.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                                    {coin.price_vnd.toLocaleString('vi-VN')} đ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
