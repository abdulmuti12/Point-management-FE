"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

/* ── Motion variants ─────────────────────────────────────────── */
const formVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

const inputVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

/* ── helpers ─────────────────────────────────────────────────── */
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
  ? `${process.env.NEXT_PUBLIC_STORAGE_URL.replace(/\/$/, "")}/`
  : API_BASE_URL
    ? `${API_BASE_URL.replace(/\/api$/, "")}/storage/`
    : "http://127.0.0.1:8000/storage/"

/* ── helpers ─────────────────────────────────────────────────── */
function resolveLogoUrl(filePath: string) {
  if (/^https?:\/\//.test(filePath) || filePath.startsWith("/")) return filePath
  return `${STORAGE_BASE_URL}${filePath}`
}

function LogoFallback({ size = "lg" }: { size?: "sm" | "lg" }) {
  const boxCls =
    size === "lg" ? "w-20 h-20 rounded-2xl" : "w-14 h-14 rounded-xl"
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

/* ── Google button ───────────────────────────────────────────── */
function GoogleButton({
  onClick,
  loading,
}: {
  onClick: () => void
  loading: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="relative w-full h-12 rounded-xl
                 bg-white/60 border border-black/10
                 flex items-center justify-center gap-3
                 hover:bg-white/80 hover:border-black/20
                 active:scale-[0.98] transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed
                 overflow-hidden"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.72.13-1.42.34-2.1V7.06H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.44 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span className="text-[14px] font-medium text-[#1a1a1a]">
        {loading ? "Menghubungkan ke Google…" : "Masuk dengan Google"}
      </span>
    </button>
  )
}

/* ── load Google Identity Services SDK ───────────────────────── */
function loadGoogleIdClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-oauth2-sdk")) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.id = "google-oauth2-sdk"
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Gagal memuat Google SDK"))
    document.head.appendChild(script)
  })
}

/* ── main page ───────────────────────────────────────────────── */
export default function CustomerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const router = useRouter()

  /* Fetch logo on mount */
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admins/active-logo`)
        const data = await res.json()
        if (data.success && data.data?.image)
          setLogoUrl(resolveLogoUrl(data.data.image))
      } catch {
        /* silently fall back */
      }
    }
    fetchLogo()
  }, [])

  /* Auto-redirect if customer already authenticated */
  useEffect(() => {
    if (localStorage.getItem("customer_token")) router.push("/customer")
  }, [router])

  const imgError = () => setLogoUrl(null)

  /* ── store customer session ───────────────────────────────── */
  const storeSession = (data: {
    token?: string
    username?: string
    email?: string
  }) => {
    if (data.token) localStorage.setItem("customer_token", data.token)
    if (data.username) localStorage.setItem("customer_name", data.username)
    if (data.email) localStorage.setItem("customer_email", data.email)
    router.push("/customer")
  }

  /* ── manual login → POST /api/customers/login-customer ──────
     Response:
       success: { success: true, data: { id, username, email, token } }
       401:     { success: false, message: "Invalid credentials" }
       403:     { success: false, needs_password_setup: true,
                 setup_token, email, message }
  ─────────────────────────────────────────────────────────────── */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualLoading(true)
    setError("")

    try {
      const res = await fetch(`${API_BASE_URL}/customers/login-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        storeSession({
          token: data.data?.token,
          username: data.data?.username,
          email: data.data?.email,
        })
        return
      }

      // 403 — needs password setup
      if (data.needs_password_setup && data.setup_token) {
        localStorage.setItem("setup_token", data.setup_token)
        localStorage.setItem("setup_email", data.email || email)
        router.push("/customer/set-password")
        return
      }

      setError(data.message || "Email atau password salah. Silakan periksa kembali.")
    } catch {
      setError("Terjadi kesalahan jaringan. Hubungi tim dukungan bila masalah berlanjut.")
    } finally {
      setManualLoading(false)
    }
  }

  /* ── Google login ────────────────────────────────────────────
     Flow:
       1. Load Google Identity SDK
       2. Show sign-in popup → user authorize
       3. SDK returns { credential: id_token }
       4. POST /api/customers/social-login { provider: "google", id_token }
       5. If account not registered → POST /api/customers/social-register-auth
       6. Store customer_token from response
  ─────────────────────────────────────────────────────────────── */
  const handleGoogleLogin = useCallback(async () => {
    setGoogleLoading(true)
    setError("")

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      setError(
        "Login Google belum dikonfigurasi. Silakan hubungi admin untuk mengatur Google OAuth."
      )
      setGoogleLoading(false)
      return
    }

    try {
      await loadGoogleIdClient()

      const idToken = await new Promise<string | null>((resolve) => {
        ;(window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            resolve(response?.credential ?? null)
          },
        })
        ;(window as any).google.accounts.id.prompt()
      })

      if (!idToken) {
        setGoogleLoading(false)
        return
      }

      // Step 1 — try social login
      const loginRes = await fetch(`${API_BASE_URL}/customers/social-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", id_token: idToken }),
      })
      const loginData = await loginRes.json()

      if (loginRes.ok && loginData.success) {
        storeSession({
          token: loginData.data?.token,
          username: loginData.data?.username,
          email: loginData.data?.email,
        })
        return
      }

      // Step 2 — not registered yet → social register
      const regRes = await fetch(
        `${API_BASE_URL}/customers/social-register-auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "google",
            id_token: idToken,
          }),
        }
      )
      const regData = await regRes.json()

      if (regRes.ok && regData.success) {
        storeSession({
          token: regData.data?.token,
          username: regData.data?.username,
          email: regData.data?.email,
        })
        return
      }

      setError(regData.message || "Login Google gagal. Silakan coba lagi.")
    } catch {
      setError("Gagal memproses login Google. Silakan coba lagi.")
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

  /* ── shared form input class ──────────────────────────────── */
  const inputCls = `
    h-12 bg-white/70 border border-black/10
    text-[#1a1a1a] text-[15px] placeholder:text-slate-400
    rounded-xl outline-none
    focus:bg-white focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25
    transition-colors disabled:opacity-50
  `

  return (
    <div className="min-h-[100dvh] bg-[#0B1120] text-white flex flex-col lg:flex-row">

      {/* ════════════════════════════════════════════════════
          LEFT — Branding panel  (hidden on mobile)
      ════════════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:flex flex-col items-center justify-center
                   w-[44%] shrink-0
                   bg-[#F5F2EB]
                   border-r border-black/[0.06] overflow-hidden
                   p-16"
      >
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px]
                        rounded-full bg-blue-400/[0.12] blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-[300px] h-[300px]
                        rounded-full bg-amber-300/[0.10] blur-[90px] pointer-events-none" />

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

          <h1 className="text-4xl font-bold tracking-tight mb-3 leading-tight text-[#1a1a1a]">
            Point
            <span className="text-blue-600"> Management</span>
          </h1>
          <p className="text-sm leading-relaxed text-[#6b6b6b]">
            Portal pelanggan untuk memantau poin, aktivitas, dan reward Anda
          </p>

          <p className="mt-14 text-xs text-[#a0a0a0]">
            &copy; {new Date().getFullYear()} Point Management
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          RIGHT — Form panel
      ════════════════════════════════════════════════════ */}
      <div
        className="flex-1 relative flex items-center justify-center p-5 sm:p-8 lg:p-12
                   bg-[url('/images/login-bg-right.png')] bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-white/[0.35] pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm sm:max-w-[380px]">

          {/* Mobile compact header */}
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
            <h1 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Selamat Datang</h1>
            <p className="text-[13px] text-[#6b6b6b] mt-1">
              Masuk ke akun pelanggan Anda
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <p className="text-sm text-[#6b6b6b]">
              Silakan masuk ke portal pelanggan untuk melanjutkan.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          {/* ── Google login button ─────────────────────────── */}
          <div className="mb-6">
            <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />
          </div>

          {/* ── Divider ──────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-black/[0.10]" />
            <span className="text-[11px] text-[#8a8a8a] uppercase tracking-widest font-medium">
              atau
            </span>
            <div className="flex-1 h-px bg-black/[0.10]" />
          </div>

          {/* ── Manual form ─────────────────────────────────── */}
          <motion.form
            onSubmit={handleManualSubmit}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >

            {/* Email */}
            <motion.div
              className="space-y-1.5"
              variants={inputVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-[#4a4a4a]"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={manualLoading}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              className="space-y-1.5"
              variants={inputVariants}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <Label
                htmlFor="password"
                className="text-[13px] font-medium text-[#4a4a4a]"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={manualLoading}
                  className={`${inputCls} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={manualLoading}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-[#7a7a7a] hover:text-[#1a1a1a] transition-colors
                             disabled:opacity-40"
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.span
                        key="eye-open"
                        initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.4, rotate: 30 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Eye className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="eye-closed"
                        initial={{ opacity: 0, scale: 0.4, rotate: 30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.4, rotate: -30 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <EyeOff className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={manualLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500
                           text-white font-semibold text-[15px]
                           rounded-xl shadow-lg shadow-blue-600/25
                           active:scale-[0.98] transition-all
                           disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {manualLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses…
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </div>

            {/* Register hint */}
            <p className="text-center text-xs text-[#8a8a8a] leading-relaxed">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => router.push("/customer/register")}
                className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Daftar sekarang
              </button>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  )
}
