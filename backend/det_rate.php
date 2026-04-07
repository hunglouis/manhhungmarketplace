<?php
header("Access-Control-Allow-Origin: *"); // Cho phép trình duyệt gọi vào đây
$url = "https://manhhungmarketplace.online";
echo file_get_contents($url);
?>
