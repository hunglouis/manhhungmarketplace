<?php
require('db_connect.php');

// 🔓 Cho phép gọi từ ngoài
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Lấy dữ liệu webhook
$data = json_decode(file_get_contents('php://input'));

if (!$data) {
    echo json_encode(['success'=>false, 'message'=>'No data']);
    exit;
}

// Lấy thông tin
$transaction_content = $data->content;
$transfer_amount = $data->transferAmount;
$transfer_type = $data->transferType;

// Chỉ xử lý tiền vào
if ($transfer_type !== "in") {
    exit;
}

// 🔍 Tách mã đơn hàng DH123
preg_match('/DH(\d+)/', $transaction_content, $matches);
$order_id = $matches[1] ?? null;

if (!$order_id) {
    echo json_encode(['success'=>false, 'message'=>'No order id']);
    exit;
}

// 🔍 Kiểm tra đơn
$result = $conn->query("SELECT * FROM tb_orders WHERE id={$order_id}");

if (!$result || !$result->fetch_object()) {
    echo json_encode(['success'=>false, 'message'=>'Order not found']);
    exit;
}

// ✅ Update Paid
$conn->query("UPDATE tb_orders SET payment_status='Paid' WHERE id='{$order_id}'");

// 🔥 GỌI WEB3 SERVER
$postData = json_encode([
    "order_id" => $order_id,
    "amount" => $transfer_amount
]);

$ch = curl_init(" https://unaddressed-yaretzi-nonneural.ngrok-free.dev/webhook-payment");

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

$response = curl_exec($ch);
curl_close($ch);

echo json_encode([
    'success'=>true,
    'order_id'=>$order_id,
    'web3'=>$response
]);
