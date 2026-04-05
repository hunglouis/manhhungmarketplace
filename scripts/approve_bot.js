import contractJSON from "../artifacts/MyTokenNew.json";
const contractABI = contractJSON.abi;

async function approveBot() {
  try {
    if (!window.ethereum) {
      alert("Cài MetaMask trước!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();

    // Polygon Mainnet = 137
    if (network.chainId !== 137) {
      alert("Hãy chuyển sang Polygon!");
      return;
    }

    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      "0xYourContractAddress",
      contractABI,
      signer
    );

    const tx = await contract.setApprovalForAll(
      "0xYourBotAddress",
      true
    );

    alert("Đang xử lý giao dịch...");

    await tx.wait();

    alert("✅ Approve thành công!");
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra!");
  }
}
