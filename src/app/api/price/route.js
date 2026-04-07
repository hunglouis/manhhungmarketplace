// File: app/api/price/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://coingecko.com', {
      next: { revalidate: 60 } // Cập nhật sau mỗi 60 giây
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
