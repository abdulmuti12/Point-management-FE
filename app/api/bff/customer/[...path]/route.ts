import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx, "GET");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx, "POST");
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx, "PUT");
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx, "PATCH");
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx, "DELETE");
}

async function proxyRequest(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
  method: string
) {
  const { path } = await ctx.params;
  const endpoint = path.join("/");

  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/customer_auth=([^;]+)/);
  const jwtToken = match ? decodeURIComponent(match[1]) : null;

  if (!jwtToken) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi. Silakan login ulang." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const targetUrl = `${API_BASE_URL}/customers/${endpoint}${url.search}`;

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = await req.text();
  }

  try {
    const res = await fetch(targetUrl, {
      method,
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
      redirect: "follow",
    });

    const text = await res.text();

    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* not JSON */
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan jaringan. Coba lagi." },
      { status: 502 }
    );
  }
}
