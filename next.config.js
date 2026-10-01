/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Defense-in-depth: also set headers here in case middleware is bypassed.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http://localhost:8000 http://127.0.0.1:8000",
      "font-src 'self' data:",
      "connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000 ws: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Hide the X-Powered-By: Next.js header.
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
}

module.exports = nextConfig
