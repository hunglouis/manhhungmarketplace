// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ManhHungMarketplace is ReentrancyGuard, Ownable {
    // 1. KHAI BÁO CÁC BIẾN "VÀNG"
    uint256 public platformFeePercent = 250; // 2.5% (tính theo phần vạn: 250/10000)
    address public platformAdmin; // Ví của Hùng Louis để nhận phí sàn

    struct Listing {
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;

    constructor() Ownable(msg.sender) {
        platformAdmin = msg.sender; // Mặc định ví người triển khai là admin
    }

    // 2. HÀM MUA BÁN & CHIA TIỀN TỰ ĐỘNG (QUAN TRỌNG NHẤT)
    function executeSale(uint256 tokenId) public payable nonReentrant {
        Listing storage item = listings[tokenId];
        require(msg.value >= item.price, "Khong du tien de mua NFT!");
        require(!item.isSold, "NFT nay da duoc ban!");

        uint256 salePrice = msg.value;
        
        // --- LOGIC CHIA HOA HỒNG ---
        uint256 platformFee = (salePrice * platformFeePercent) / 10000; // Tính 2.5%
        uint256 sellerProceeds = salePrice - platformFee; // Còn lại cho người bán

        // A. Chuyển 2.5% về ví Hùng Louis (Tự động & Minh bạch)
        payable(platformAdmin).transfer(platformFee);

        // B. Chuyển 97.5% về ví Người bán (Nghệ sĩ)
        item.seller.transfer(sellerProceeds);

        item.isSold = true;
        
        // C. Chuyển quyền sở hữu NFT cho người mua
        // (Lệnh transfer NFT sẽ nằm ở đây khi kết hợp với ERC721)
    }

    // 3. QUYỀN HẠN CỦA CHỦ SÀN (HÙNG LOUIS)
    function updatePlatformFee(uint256 _newFee) public onlyOwner {
        platformFeePercent = _newFee; // Bạn có thể đổi từ 2.5% lên 3% hoặc xuống 2% tùy ý
    }

    function setPlatformAdmin(address _newAdmin) public onlyOwner {
        platformAdmin = _newAdmin; // Đổi ví nhận tiền nếu cần
    }
}
