require("dotenv").config();
const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

console.log("🤖 Bot đang chạy...");

// 🔥 LISTEN BLOCK
provider.on("block", async (blockNumber) => {
  const block = await provider.getBlock(blockNumber);

  for (let txHash of block.transactions) {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) continue;

    // kiểm tra tiền gửi tới ví bạn
    if (
      tx.to.toLowerCase() ===
      process.env.WALLET_ADDRESS.toLowerCase()
    ) {
      const amount = Number(ethers.formatEther(tx.value));

      // 🔍 tìm order pending
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending");

      for (let order of orders) {
        // match amount
        if (Math.abs(order.amount - amount) < 0.00001) {
          console.log("✅ Match order:", order.id);

          await supabase
            .from("orders")
            .update({
              status: "paid"
            })
            .eq("id", order.id);

          console.log("🎉 Đã cập nhật PAID");
        }
      }
    }
  }
});
