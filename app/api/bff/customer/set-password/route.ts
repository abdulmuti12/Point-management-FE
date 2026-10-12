import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/**
 * POST /api/bff/customer/set-password
 *
 * Sets the customer's password using a setup_token (received via email).
 * On success, sets the `customer_auth` HttpOnly cookie.
 */
export async function POST(req: NextRequest) {
  const { setup_token, email, new_password, confirm_password } = await req.json();

  if (!setup_token || !new_password) {
    return NextResponse.json(
      { success: false, message: "Setup token dan password wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/customers/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setup_token, email, new_password, confirm_password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Gagal mengatur password." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        name: data.data?.username || email?.split("@")[0] || "",
        email: data.data?.email || email || "",
        token: data.data?.token || null,
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
    } else {
      // Backend set-password sometimes doesn't return a token.
      // Validate the cookie against the backend to ensure session exists.
      const verifyRes = await fetch(`${API_BASE_URL}/customers/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
      });
      if (!verifyRes.ok) {
        // Force a fresh login to get a valid token
        const loginRes = await fetch(`${API_BASE_URL}/customers/login-customer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: new_password }),
        });
        const loginData = await loginRes.json();
        const freshToken = loginData.data?.token || loginData.token;
        if (freshToken) {
          response.cookies.set("customer_auth", freshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
          });
        }
      }
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan jaringan. Coba lagi." },
      { status: 500 }
    );
  }
}
