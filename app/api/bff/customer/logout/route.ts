import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/customer_auth=([^;]+)/);
  const jwtToken = match ? decodeURIComponent(match[1]) : null;

  if (jwtToken) {
    try {
      await fetch(`${API_BASE_URL}/customers/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
    } catch {
      /* ignore */
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("customer_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
