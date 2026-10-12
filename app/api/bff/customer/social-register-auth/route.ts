import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/**
 * POST /api/bff/customer/social-register-auth
 * Social register + auth (Google). On success, sets `customer_auth` HttpOnly cookie.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(`${API_BASE_URL}/customers/social-register-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Social register gagal." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        name: data.data?.username || data.username || body.name || "",
        email: data.data?.email || data.email || body.email || "",
        token: data.data?.token || data.token || null,
        setup_token: data.data?.setup_token || null,
        setup_email: data.data?.setup_email || null,
      },
    });

    const customerToken = data.data?.token;
    if (customerToken) {
      response.cookies.set("customer_auth", customerToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan jaringan. Coba lagi." },
      { status: 500 }
    );
  }
}
