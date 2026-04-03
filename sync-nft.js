import Moralis from "moralis";
import XLSX from "xlsx";
import cron from "node-cron";
import fs from "fs";

const API_KEY = eyJub25jZSI6ImYwOGZkZmVjLTJkZmEtNDg4OS1hMzc4LWQ2MjRmZTA2NzZkOSIsIm9yZ0lkIjoiNTA3MDY1IiwidXNlcklkIjoiNTIxNzM4IiwidHlwZUlkIjoiYzhiNTUzZTItYjAwMC00MjJhLTllOGYtOTljYzBhNjZiODUxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzQ0ODA3NTgsImV4cCI6NDkzMDI0MDc1OH0.ihsH2X3KQsrcdHtTFGUM_qyGBA85L7dklQxbyPg4lO0;
const ADDRESS = 0x8429BC345266D03a433b25B8Fb6301274294D81E;

await Moralis.start({ apiKey: API_KEY });

async function fetchAllNFTs() {
  let cursor = null;
  let allNFTs = [];

  do {
    const res = await Moralis.EvmApi.nft.getWalletNFTs({
      chain: "polygon",
      address: ADDRESS,
      cursor: cursor,
      normalizeMetadata: true
    });

    allNFTs = allNFTs.concat(res.raw.result);
    cursor = res.raw.cursor;

  } while (cursor);

  return allNFTs;
}

async function exportExcel() {
  const nfts = await fetchAllNFTs();

  const rows = nfts.map(nft => {
    const meta = nft.normalized_metadata || {};

    return {
      token_address: nft.token_address,
      token_id: nft.token_id,
      name: meta.name,
      collection: nft.name,
      image: meta.image,
      description: meta.description
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "NFTs");

  XLSX.writeFile(workbook, "nft_data.xlsx");

  console.log("✅ Exported NFT data!");
}

// chạy mỗi ngày lúc 00:00
cron.schedule("0 0 * * *", () => {
  exportExcel();
});

// chạy thử ngay
exportExcel();
