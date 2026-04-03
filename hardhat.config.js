import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun", // Bắt buộc phải có dòng này để chạy được lệnh mcopy
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
