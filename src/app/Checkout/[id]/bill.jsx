import PaymentStatus from '@/components/PaymentStatus';
import { supabase } from '@/lib/supabaseClient';

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  // 1. Lấy dữ liệu đơn hàng từ Database
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!order) return <div>Không tìm thấy đơn hàng</div>;

  // 2. Tạo link QR động
  const qrUrl = `https://sepay.vn{order.amount}&des=${order.payment_content}`;

  return (
    <div className="max-w-md mx-auto p-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Thanh toán bản nhạc</h1>
      
      {/* HIỂN THỊ MÃ QR */}
      <div className="bg-white p-4 shadow-lg rounded-xl inline-block">
        <img src={qrUrl} alt="Mã QR BIDV" />
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-left">
        <p>📌 Nội dung: <strong>{order.payment_content}</strong></p>
        <p>💰 Số tiền: <strong>{Number(order.amount).toLocaleString()} VNĐ</strong></p>
      </div>

      {/* GỌI COMPONENT THEO DÕI TRẠNG THÁI (REALTIME) */}
      <PaymentStatus orderId={order.id} />
    </div>
  );
}
