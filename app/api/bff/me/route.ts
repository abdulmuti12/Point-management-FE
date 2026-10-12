import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";

  const adminMatch = cookieHeader.match(/admin_auth=([^;]+)/);
  if (adminMatch) {
    return NextResponse.json({
      authenticated: true,
      role: "admin",
    });
  }

  const customerMatch = cookieHeader.match(/customer_auth=([^;]+)/);
  if (customerMatch) {
    return NextResponse.json({
      authenticated: true,
      role: "customer",
    });
  }

  return NextResponse.json({ authenticated: false, role: null });
}
