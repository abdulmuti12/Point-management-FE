import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const { email, password, phone, code } = await req.json();

  const body: Record<string, unknown> = {};
  if (email) body.email = email;
  if (password) body.password = password;
  if (phone) body.phone = phone;
  if (code) body.code = code;

  try {
    const res = await fetch(`${API_BASE_URL}/customers/login-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // ── 403: needs password setup → pass through the full payload ──
    if (res.status === 403 && data.needs_password_setup) {
      const setupResponse = NextResponse.json(
        {
          success: false,
          message: data.message || "Silakan set password baru untuk mengaktifkan akun Anda.",
          needs_password_setup: true,
          setup_token: data.setup_token || null,
          email: data.email || email || "",
        },
        { status: 403 },
      );

      // Also set the cookie if the backend included a token (some flows do)
      const token = data.setup_token || data.token;
      if (token) {
        setupResponse.cookies.set("customer_auth", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60, // 1 hour for setup token
          path: "/",
        });
      }
      return setupResponse;
    }

    if (!res.ok || (!data.success && !data.token)) {
      return NextResponse.json(
        { success: false, message: data.message || "Login customer gagal." },
        { status: res.status },
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        name: data.username || data.name || (email ? email.split("@")[0] : ""),
        email: data.email || email || "",
        token: data.data?.token || data.token || null,
        setup_token: data.data?.setup_token || data.setup_token || null,
        setup_email: data.data?.setup_email || data.setup_email || null,
      },
    });

    // Set customer session cookie
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
