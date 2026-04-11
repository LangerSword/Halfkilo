import { NextResponse } from "next/server";

const MASTRA_API = process.env.NEXT_PUBLIC_MASTRA_API ?? "http://localhost:3002";

export async function GET(request: Request, { params }: { params: { action: string } }) {
  const { action } = params;
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    const res = await fetch(`${MASTRA_API}/api/trade/${action}${queryString}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Trade API fetch error:", err);
    return NextResponse.json(
      { error: "Failed to connect to Trade backend" },
      { status: 502 }
    );
  }
}

export async function POST(request: Request, { params }: { params: { action: string } }) {
  const { action } = params;

  try {
    const body = await request.json();

    const res = await fetch(`${MASTRA_API}/api/trade/${action}`, {
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
    console.error("Trade API error:", err);
    return NextResponse.json(
      { error: "Failed to process trade request" },
      { status: 502 }
    );
  }
}
