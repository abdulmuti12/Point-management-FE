import { NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_auth=([^;]+)/);
  const jwtToken = match ? decodeURIComponent(match[1]) : null;

  // Best-effort: notify backend to invalidate the token
  if (jwtToken) {
    try {
      await fetch(`${API_BASE_URL}/admins/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
    } catch {
      /* ignore — token still invalidated by clearing cookie */
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
