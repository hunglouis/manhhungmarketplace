use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MY_COLLECTIONS} from './constants.js';
import * as XLSX from 'xlsx'; // Thêm dòng này ở đầu file page.js
// Dán đoạn này ở trên cùng file, dưới các dòng import
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinning {
      animation: spin 3s linear infinite;
    }
    .paused {
      animation-play-state: paused;
    }
  `;
  document.head.appendChild(style);
}


// 1. Khởi tạo Supabase Client (Tự động lấy từ .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const setstatus{'message');
const apiKey = process.env.next_public_alchemy_key;


// Replace with your Alchemy API Key
const apiKey = "demo";
const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}`;
 
async function getNFTData() {
  try {
    // The wallet address we want to query for NFTs:
    const ownerAddr = "vitalik.eth";
    console.log("fetching NFTs for address:", ownerAddr);
    console.log("...");
 
    // Get NFTs for owner
    const nftsResponse = await fetch(`${baseURL}/getNFTsForOwner?owner=${ownerAddr}&pageSize=5`);
    const nftsData = await nftsResponse.json();
 
    console.log("number of NFTs found:", nftsData.totalCount);
    console.log("...");
 
    // Print contract address and tokenId for each NFT:
    for (const nft of nftsData.ownedNfts) {
      console.log("===");
      console.log("contract address:", nft.contract.address);
      console.log("token ID:", nft.tokenId);
    }
    console.log("===");
 
    // Fetch metadata for a particular NFT:
    console.log("fetching metadata for a Crypto Coven NFT...");
    const contractAddress = "0x5180db8F5c931aaE63c74266b211F580155ecac8";
    const tokenId = "1590";
 
    const metadataResponse = await fetch(
      `${baseURL}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    );
    const response = await metadataResponse.json();
 
    // Print some commonly used fields:
    console.log("NFT name: ", response.name || response.title);
    console.log("token type: ", response.tokenType);
    console.log("tokenUri: ", response.tokenUri);
    console.log("image url: ", response.image?.originalUrl || response.rawMetadata?.image);
    console.log("time last updated: ", response.timeLastUpdated);
    console.log("===");
 
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}
 
getNFTData();