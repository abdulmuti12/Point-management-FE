"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
  ? `${process.env.NEXT_PUBLIC_STORAGE_URL.replace(/\/$/, "")}/`
  : API_BASE_URL
    ? `${API_BASE_URL.replace(/\/api$/, "")}/storage/`
    : "http://127.0.0.1:8000/storage/"

/* ── small helpers ───────────────────────────────────────────── */
function resolveLogoUrl(filePath: string) {
  if (/^https?:\/\//.test(filePath) || filePath.startsWith("/")) return filePath
  return `${STORAGE_BASE_URL}${filePath}`
}

/* Fallback logo block when the remote fetch fails */
function LogoFallback({ size = "lg" }: { size?: "sm" | "lg" }) {
  const boxCls =
    size === "lg"
      ? "w-20 h-20 rounded-2xl"
      : "w-14 h-14 rounded-xl"
  const textCls = size === "lg" ? "text-3xl" : "text-xl"
  return (
    <div
      className={`${boxCls} bg-white/[0.06] border border-white/10
                  flex items-center justify-center mb-6`}
    >
      <span className={`${textCls} font-bold text-white/40 tracking-tighter select-none`}>
        P
      </span>
    </div>
  )
}

/* ── error banner ─────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-5 flex items-start gap-3 p-3 rounded-lg
                 bg-red-500/10 border border-red-500/20"
      role="alert"
    >
      <svg
        className="w-4 h-4 text-red-400 shrink-0 mt-px"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      <p className="text-[13px] text-red-400 leading-relaxed">{message}</p>
    </div>
  )
}

/* ── main page ────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const router = useRouter()

  /* Fetch admin logo on mount */
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admins/active-logo`)
        const data = await res.json()
        if (data.success && data.data?.image)
          setLogoUrl(resolveLogoUrl(data.data.image))
      } catch {
        /* silently fall back to placeholder */
      }
    }
    fetchLogo()
  }, [])

  /* Auto-redirect if already authenticated */
  useEffect(() => {
    if (localStorage.getItem("token")) router.push("/admin")
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`${API_BASE_URL}/admins/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("user_menus", JSON.stringify(data.data.menus || []))
        localStorage.setItem("user_name", data.data.name || email.split("@")[0])
        localStorage.setItem("user_email", data.data.email || email)
        setTimeout(() => router.push("/admin"), 600)
      } else {
        setError(data.message || "Email atau password salah. Silakan periksa kembali.")
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Hubungi admin bila masalah berlanjut.")
    } finally {
      setIsLoading(false)
    }
  }

  const imgError = () => setLogoUrl(null)

  /* ── shared form fields ────────────────────────────────────── */
  const inputCls = `
    h-12 bg-white/[0.04] border border-white/10
    text-white text-[15px] placeholder:text-slate-600
    rounded-xl outline-none
    focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
    transition-colors disabled:opacity-50
  `

  return (
    <div className="min-h-[100dvh] bg-[#0B1120] text-white flex flex-col lg:flex-row">

      {/* ════════════════════════════════════════════════════
          LEFT — Branding panel  (hidden on mobile, shown lg+)
      ════════════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:flex flex-col items-center justify-center
                   w-[44%] shrink-0
                   bg-gradient-to-br from-[#0B1120] via-[#0E1830] to-[#0B1120]
                   border-r border-white/[0.06] overflow-hidden
                   p-16"
      >
        {/* soft ambient glows */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px]
                        rounded-full bg-blue-500/[0.07] blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-[300px] h-[300px]
                        rounded-full bg-cyan-500/[0.06] blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Point Management"
              onError={imgError}
              className="h-20 w-auto object-contain mb-7"
            />
          ) : (
            <LogoFallback size="lg" />
          )}

          <h1 className="text-4xl font-bold tracking-tight mb-3 leading-tight">
            Point
            <span className="text-blue-400"> Management</span>
          </h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Panel terpadu untuk mengelola titik, aktivitas, dan operasional
          </p>

          {/* subtle bottom hint */}
          <p className="mt-14 text-xs text-slate-700">
            &copy; {new Date().getFullYear()} Point Management
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          RIGHT — Form panel  (full width on mobile, right 56% on lg+)
      ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-sm sm:max-w-[380px]">

          {/* Mobile compact header (hidden on lg+) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Point"
                onError={imgError}
                className="h-14 w-auto object-contain mb-4"
              />
            ) : (
              <LogoFallback size="sm" />
            )}
            <h1 className="text-xl font-bold tracking-tight">Sign In</h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Log in to your admin account
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            {/* <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2> */}
            <p className="text-sm text-slate-500 mt-1">
              Log in to your dashboard to continue.
            </p>
          </div>

          {/* Error */}
          {error && <ErrorBanner message={error} />}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-slate-400">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-slate-400">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`${inputCls} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500
                           text-white font-semibold text-[15px]
                           rounded-xl shadow-lg shadow-blue-600/25
                           active:scale-[0.98] transition-all
                           disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses…
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </div>

            {/* Footer hint */}
            <p className="text-center text-xs text-slate-600 leading-relaxed pt-2">
              Lupa password? Hubungi admin sistem Anda
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
