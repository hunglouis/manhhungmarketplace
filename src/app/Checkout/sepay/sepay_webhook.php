<?php

header("Content-Type: application/json");

// 🔥 giả lập dữ liệu test
$order_id = 123;

// 🔗 URL backend Render
$url = "https://manhhungmarketplace.onrender.com/webhook-payment";

// 🔥 data gửi đi
$data = [
    "order_id" => $order_id
];

// 🚀 gọi API
$ch = curl_init($url);

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// 🔥 thêm debug
$response = curl_exec($ch);

if ($response === false) {
    echo json_encode([
        "error" => curl_error($ch)
    ]);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

// 👉 in ra kết quả thật
echo json_encode([
    "status" => $httpCode,
    "response" => json_decode($response, true),
    "raw" => $response
]);
