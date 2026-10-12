import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: security headers + route-level auth guard.
 *
 * Auth guard:
 *   - /admin/*  → requires `admin_auth` HttpOnly cookie
 *   - /customer/* (excluding /customer/login, /customer/register, /customer/set-password)
 *                 → requires `customer_auth` HttpOnly cookie
 */

const ADMIN_PUBLIC: string[] = ["/login"];
const CUSTOMER_PUBLIC: string[] = [
  "/customer/login",
  "/customer/register",
  "/customer/set-password",
];

function hasCookie(request: NextRequest, name: string): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader.includes(`${name}=`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  /* ── Route-level auth guard ─────────────────────────────────── */
  if (pathname.startsWith("/admin")) {
    // The /admin layout client-side check will redirect on load;
    // middleware adds a server-side gate as a second layer.
    if (!ADMIN_PUBLIC.some((p) => pathname === p) && !hasCookie(request, "admin_auth")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/customer")) {
    if (
      !CUSTOMER_PUBLIC.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      ) &&
      !hasCookie(request, "customer_auth")
    ) {
      return NextResponse.redirect(new URL("/customer/login", request.url));
    }
  }

  /* ── Security headers (applied to all routes) ────────────────── */

  // 1. HSTS — enforce HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // 2. X-Frame-Options — mitigate clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // 3. X-Content-Type-Options — prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 4. Referrer-Policy — limit referrer leakage
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 5. Permissions-Policy — disable powerful features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // 6. CSP — XSS / data-injection mitigation
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http://localhost:8000 http://127.0.0.1:8000",
    "font-src 'self' data:",
    "connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000 ws: wss:",
    "frame-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // 7. Strip fingerprinting headers
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  return response;
}

export const config = {
  // Exclude Next.js internals and static assets from the matcher
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
