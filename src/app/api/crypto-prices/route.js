import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; // Cache dữ liệu trong 60 giây để tránh overload API CoinGecko

// Khởi tạo Supabase Client phía Server
const supabase = createClient(
  'https://supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const apiKey = process.env.COINGECKO_API_KEY;
  const coinIds = 'bitcoin,ethereum,binancecoin,solana';
  const url = `https://coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd,vnd`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-cg-demo-api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`CoinGecko error: ${response.status}`);
    const data = await response.json();

    // --- LOGIC TỰ ĐỘNG LƯU LỊCH SỬ VÀO SUPABASE ---
    const insertRows = Object.keys(data).map((id) => {
      // Định nghĩa ký hiệu viết tắt cho gọn gàng
      const symbols = { bitcoin: 'BTC', ethereum: 'ETH', binancecoin: 'BNB', solana: 'SOL' };
      return {
        coin_id: id,
        symbol: symbols[id] || id.toUpperCase(),
        price_usd: data[id].usd,
        price_vnd: data[id].vnd,
      };
    });

    // Thực hiện lưu đồng thời tất cả các dòng vào bảng crypto_history
    const { error: dbError } = await supabase.from('crypto_history').insert(insertRows);
    if (dbError) console.error('Lỗi khi lưu lịch sử vào Supabase:', dbError);
    // ------------------------------------------------

    return NextResponse.json({ success: true, data: insertRows });
  } catch (error) {
    console.error('Lỗi API:', error);
    return NextResponse.json({ success: false, error: 'Không thể xử lý dữ liệu' }, { status: 500 });
  }
}
