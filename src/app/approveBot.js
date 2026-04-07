import contractJSON from "../artifacts/MyTokenNew.json";

const { ethers } = require("ethers");

// ⚠️ Nếu chạy trên browser (React/Next.js) thì KHÔNG dùng require JSON
// → import ABI theo cách khác (mình có note bên dưới)

async function approveBot() {
  try {
    // Kiểm tra MetaMask
    if (!window.ethereum) {
      throw new Error("MetaMask chưa được cài!");
    }

    // Kết nối ví
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();

    // 🔧 Thay thông tin của bạn
    const contractAddress = "0xYourContractAddress";
    const botAddress = "0xYourBotAddress";

    // ⚠️ Nếu dùng Node.js:
    const contractABI = contractJSON.abi;

    // Tạo contract instance
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    console.log("Đang gửi transaction approve...");

    // Gọi hàm approve
    const tx = await contract.setApprovalForAll(botAddress, true);

    console.log("Tx hash:", tx.hash);

    // Chờ confirm
    await tx.wait();

    console.log("✅ Bot đã được ủy quyền thành công!");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// Run
approveBot();
