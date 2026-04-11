import { NextResponse } from "next/server";

const MASTRA_API = process.env.NEXT_PUBLIC_MASTRA_API ?? "http://localhost:3002";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${MASTRA_API}/api/match/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Match start proxy error:", err);
    return NextResponse.json(
      { error: "Failed to connect to Mastra backend" },
      { status: 502 }
    );
  }
}
