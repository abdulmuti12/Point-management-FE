import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/* ── Cookie helper types ─────────────────────────────────────── */
type CookieOptions = {
  name: string;
  value: string;
  maxAge: number;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
  path?: string;
};

function setCookie(res: NextResponse, { name, value, maxAge, httpOnly = true, sameSite = "lax", secure, path = "/" }: CookieOptions) {
  const secureAttr = secure !== undefined ? secure : process.env.NODE_ENV === "production";
  res.cookies.set(name, value, {
    httpOnly,
    sameSite,
    secure: secureAttr,
    maxAge,
    path,
  });
}

function clearCookie(res: NextResponse, name: string) {
  res.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

/* ── 1. POST /api/bff/login ─────────────────────────────────── */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email dan password wajib diisi." }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admins/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      // Do NOT set credentials: "include" — we handle cookies manually
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Email atau password salah." },
        { status: res.status }
      );
    }

    const jwtToken = data.data.token;
    const response = NextResponse.json({
      success: true,
      data: {
        name: data.data.name || email.split("@")[0],
        email: data.data.email || email,
        menus: data.data.menus || [],
      },
    });

    // Secure HttpOnly cookie — browser cannot read, only sent to server
    setCookie(response, {
      name: "admin_auth",
      value: jwtToken,
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan jaringan. Hubungi admin." },
      { status: 500 }
    );
  }
}

/* ── 2. POST /api/bff/logout ─────────────────────────────────── */
export async function DELETE() {
  // Best-effort: call backend logout endpoint to invalidate the token
  const authCookie = /* read from request */ null; // handled by generic DELETE below
  return handleLogout();
}

async function handleLogout() {
  const response = NextResponse.json({ success: true });
  clearCookie(response, "admin_auth");
  return response;
}

/* ── 3. GET /api/bff/me ─────────────────────────────────────── */
export async function GET() {
  // We use a catch-all pattern instead, so this handler is unused here.
  // The catch-all at app/api/bff/[...path]/route.ts handles GET/PUT/DELETE.
  return NextResponse.json({ message: "Use /api/bff/[...path]" }, { status: 404 });
}
