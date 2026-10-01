import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security headers middleware.
 * Adds HSTS, X-Frame-Options, CSP, X-Content-Type-Options and
 * removes fingerprinting headers exposed by default.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 1. Strict-Transport-Security (HSTS) — enforce HTTPS for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // 2. X-Frame-Options — mitigate clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // 3. X-Content-Type-Options — prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // 4. Referrer-Policy — limit referrer leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // 5. Permissions-Policy — disable powerful features by default
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // 6. Content-Security-Policy — XSS / data-injection mitigation.
  //    Adjust img-src / connect-src / frame-src if you load external assets.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http://localhost:8000 http://127.0.0.1:8000",
    "font-src 'self' data:",
    "connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000 ws: wss:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  // 7. Strip fingerprinting headers added by Next.js / proxies
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

export const config = {
  // Run on every route except static assets and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}