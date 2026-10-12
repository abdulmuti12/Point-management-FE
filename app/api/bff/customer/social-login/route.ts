import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/**
 * POST /api/bff/customer/social-login
 * OAuth login (Google). On success, sets `customer_auth` HttpOnly cookie.
 */
export async function POST(req: NextRequest) {
  const { provider, id_token, email, phone, name } = await req.json();

  if (!provider || !id_token) {
    return NextResponse.json(
      { success: false, message: "Provider dan id_token wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/customers/social-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, id_token, email, phone, name }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Social login gagal." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        name: data.data?.username || data.username || data.data?.name || name || "",
        email: data.data?.email || data.email || email || "",
        token: data.data?.token || data.token || null,
      },
    });

    const customerToken = data.data?.token || data.token;
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
