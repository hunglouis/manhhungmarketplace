<?php

    /*
    File db_connect.php
    File này dùng cho các file khác include vào. Mục đích để khởi tạo kết nối CSDL
    */
    
    // Khai báo cấu hình kết nối CSDL. Tuỳ chỉnh ở đây nếu tham số kết nối CSDL của bạn khác
    $servername = "localhost";
    $username = "host_sepay";
    $password = "Noidaoxa2014";
    $dbname = "host_sepay";

    // Kết nối CSDL sử dụng MySQLi.
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Kiểm tra kết nối
    if ($conn->connect_error) {
        echo json_encode(['success'=>FALSE, 'message' => 'MySQL connection failed: '. $conn->connect_error]);
        die();
    }
 
?>