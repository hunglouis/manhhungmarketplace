<?php
header("Access-Control-Allow-Origin: *"); // Cho phép Frontend gọi vào đây
header("Content-Type: application/json");

// Gọi hộ sang Coingecko từ phía Server (Server gọi Server không bị CORS)
$url = "https://manhhungmarketplace.online";
$response = file_get_contents($url);
echo $response;
?>
