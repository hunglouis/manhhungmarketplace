<?php
    $servername = "localhost";
    $username = "webhooks_receiver";
    $password = "EL2vKpfpDLsz";
    $dbname = "webhooks_receiver";

    // Kết nối đến MySQL
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Kiểm tra kết nối
    if ($conn->connect_error) {
        header('Content-Type: application/json');
        echo json_encode(['success' => FALSE, 'message' => 'MySQL connection failed: ' . $conn->connect_error]);
        die();
    }

    // Lấy dữ liệu từ webhooks
    $data = json_decode(file_get_contents('php://input'));

    if (!is_object($data)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => FALSE, 'message' => 'No data']);
        die();
    }

    // Khởi tạo các biến từ dữ liệu SePay gửi sang
    $gateway = $conn->real_escape_string($data->gateway);
    $transaction_date = $conn->real_escape_string($data->transactionDate);
    $account_number = $conn->real_escape_string($data->accountNumber);
    $sub_account = $conn->real_escape_string($data->subAccount);

    $transfer_type = $data->transferType;
    $transfer_amount = $data->transferAmount;
    $accumulated = $data->accumulated;

    $code = $conn->real_escape_string($data->code);
    $transaction_content = $conn->real_escape_string($data->content);
    $reference_number = $conn->real_escape_string($data->referenceCode);
    $body = $conn->real_escape_string($data->description);

    $amount_in = 0;
    $amount_out = 0;

    // Kiểm tra giao dịch tiền vào hay tiền ra
    if ($transfer_type == "in") {
        $amount_in = $transfer_amount;
    } else if ($transfer_type == "out") {
        $amount_out = $transfer_amount;
    }

    // Tạo query SQL
    $sql = "INSERT INTO tb_transactions (gateway, transaction_date, account_number, sub_account, amount_in, amount_out, accumulated, code, transaction_content, reference_number, body) 
            VALUES ('{$gateway}', '{$transaction_date}', '{$account_number}', '{$sub_account}', '{$amount_in}', '{$amount_out}', '{$accumulated}', '{$code}', '{$transaction_content}', '{$reference_number}', '{$body}')";

    header('Content-Type: application/json');
    // Chạy query để lưu giao dịch vào CSDL
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => TRUE]);
    } else {
        echo json_encode(['success' => FALSE, 'message' => 'Can not insert record to mysql: ' . $conn->error]);
    }

    $conn->close();
?>
