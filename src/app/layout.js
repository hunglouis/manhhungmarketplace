export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
export const metadata = {
  title: 'Hùng Louis Music NFT Studio - Bản nhạc độc bản',
  description: 'Khám phá và sở hữu những bản nhạc NFT chưa từng được công bố của nghệ sĩ Hùng Louis.',
  openGraph: {
    images: ['https://gateway.pinata.cloud'],
  },
}
