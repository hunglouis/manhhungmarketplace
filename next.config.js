/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
reactStrictMode: true,// Nếu bạn có các cấu hình cũ khác, hãy giữ chúng ở trong dấu ngoặc nhọn này
};

export default nextConfig;
