/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
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
    ].join('; '),
  },
]

const nextConfig = {
  output: "standalone",
  devIndicators: {
    position: "bottom-right",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  images: {
    unoptimized: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  // ── No API rewrites ──────────────────────────────────────────────
  // All FE API calls go through /api/bff/*, handled by the Next.js BFF
  // route handlers under app/api/bff/. A previous /api/:path* → Go API
  // rewrite intercepted BFF routes (rewrites run before route handlers)
  // and 404-d on the Go API's nonexistent /api/bf/* namespace.
}

module.exports = nextConfig
