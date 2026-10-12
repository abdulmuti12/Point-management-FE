import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(`${API_BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Pendaftaran gagal." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        name: data.data?.username || data.data?.name || "",
        email: data.data?.email || "",
        token: data.data?.token || null,
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
