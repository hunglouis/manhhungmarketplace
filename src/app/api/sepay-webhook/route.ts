import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Khởi tạo Supabase Admin (dùng Service Role Key để có quyền ghi)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, transferAmount, referenceCode } = body;

    // 1. Tìm đơn hàng dựa trên nội dung chuyển khoản (Ví dụ: DH12345)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_content', content)
      .eq('status', 'pending') // Chỉ xử lý đơn chưa giao
      .single();

    if (orderError || !order) {
      return NextResponse.json({ message: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    // 2. Kiểm tra số tiền (Cho phép chênh lệch nhỏ nếu cần)
    if (Number(transferAmount) < Number(order.amount)) {
      return NextResponse.json({ message: "Số tiền không khớp" }, { status: 400 });
    }

    // 3. Gọi Bot tự động chuyển NFT (Dùng Private Key trên Server)
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, ABI_CUA_BAN, botWallet);

    // Thực hiện lệnh chuyển NFT từ ví Admin sang ví Khách
    const tx = await contract.transferFrom(
      process.env.ADMIN_WALLET_ADDRESS!, // Ví đang giữ NFT
      order.buyer_address,               // Ví khách đã lưu trong DB
      order.nft_id                       // ID của NFT
    );
    await tx.wait(); // Đợi block confirmation

    // 4. Cập nhật trạng thái "Thành công" vào Supabase
    await supabase
      .from('orders')
      .update({ status: 'completed', tx_hash: tx.hash })
      .eq('id', order.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi xử lý Webhook:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
