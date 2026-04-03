"use client"; // Bắt buộc phải có dòng này ở đầu file
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Chỉnh đường dẫn tới file supabase của bạn

export default function PaymentStatus({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (!orderId) return;

    // Lắng nghe sự thay đổi của dòng đơn hàng trong bảng 'orders'
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `id=eq.${orderId}` 
        },
        (payload) => {
          console.log('Cập nhật đơn hàng:', payload.new);
          if (payload.new.status === 'completed') {
            setStatus('completed');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50 text-center">
      {status === 'pending' ? (
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-blue-600 font-medium">Đang đợi ngân hàng BIDV xác nhận...</p>
        </div>
      ) : (
        <div className="text-green-600">
          <h3 className="text-xl font-bold">✅ Thanh toán thành công!</h3>
          <p>Bot đã gửi NFT vào ví của bạn. Hãy kiểm tra Metamask.</p>
        </div>
      )}
    </div>
  );
}
