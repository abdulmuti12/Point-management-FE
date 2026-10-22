"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"

/* ── Google Identity SDK loader ─────────────────────────────── */
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
    script.onerror = () => reject(new Error("Failed to load Google SDK"))
    document.head.appendChild(script)
  })
}

/* ── field styles (light, matching login page) ─────────────── */
const inputCls = `
  h-12 bg-white/70 border border-black/10
  text-[#1a1a1a] text-[15px] placeholder:text-slate-400
  rounded-xl outline-none
  focus:bg-white focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25
  transition-colors disabled:opacity-50
`

const labelCls = "text-[11px] font-semibold text-[#6b6b6b] uppercase tracking-[0.12em] mb-1.5 block"

/* ── helpers (replicated from login page) ──────────────────── */
const STORAGE_BASE_URL = "/api/bff/storage/"

function resolveLogoUrl(filePath: string) {
  if (/^https?:\/\//.test(filePath) || filePath.startsWith("/")) return filePath
  return `${STORAGE_BASE_URL}${filePath}`
}

function LogoFallback({ size = "lg" }: { size?: "sm" | "lg" }) {
  const boxCls = size === "lg" ? "w-20 h-20 rounded-2xl" : "w-14 h-14 rounded-xl"
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

/* ── shared small pieces ────────────────────────────────────── */
function SuccessBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-5">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
      <p className="text-[13px] text-emerald-700 leading-relaxed">{text}</p>
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

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0">
      <Label className={labelCls}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

/* ── Google register button (light, matching login) ────────── */
function GoogleRegisterButton({
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
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.72.13-1.42.34-2.1V7.06H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.44 1.18 4.94l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      )}
      <span className="text-[14px] font-medium text-[#1a1a1a]">
        {loading ? "Connecting to Google…" : "Register with Google"}
      </span>
    </button>
  )
}

/* ── main page ──────────────────────────────────────────────── */
export default function CustomerRegisterPage() {
  const router = useRouter()

  // manual form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState("")
  const [manualSuccess, setManualSuccess] = useState("")

  // google state
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")

  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
        const res = await fetch(`${apiBase}/admins/active-logo`)
        const data = await res.json()
        if (data.success && data.data?.image) setLogoUrl(resolveLogoUrl(data.data.image))
      } catch {
        /* silently fall back */
      }
    }
    fetchLogo()
  }, [])

  const imgError = () => setLogoUrl(null)

  /* ── manual register → POST /api/bff/customer/register ───── */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualLoading(true)
    setManualError("")
    setManualSuccess("")

    try {
      const res = await fetch("/api/bff/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          full_name: name,
          email,
          phone_number: phone,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setManualSuccess(
          "Account registered successfully. A temporary password has been sent to your email. Please log in using the password you received."
        )
        return
      }

      // duplicate field errors
      if (data.duplicate_fields?.length) {
        const field: string = data.duplicate_fields[0]
        const msg =
          field === "email"
            ? "Email is already registered in the system. Please use a different email or log in directly."
            : "Phone number is already registered. Please use a different number."
        setManualError(msg)
        return
      }

      setManualError(data.message || "Registration failed. Please try again.")
    } catch {
      setManualError("A network error occurred. Please try again.")
    } finally {
      setManualLoading(false)
    }
  }

  /* ── Google register → POST /api/bff/customer/social-register-auth ── */
  const handleGoogleRegister = useCallback(async () => {
    setGoogleLoading(true)
    setGoogleError("")

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      setGoogleError(
        "Google login is not configured. Please contact the admin to set up Google OAuth."
      )
      setGoogleLoading(false)
      return
    }

    try {
      await loadGoogleIdClient()

      const idToken = await new Promise<string | null>((resolve) => {
        ;(window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => resolve(response?.credential ?? null),
        })
        ;(window as any).google.accounts.id.prompt()
      })

      if (!idToken) {
        setGoogleLoading(false)
        return
      }

      const res = await fetch(
        "/api/bff/customer/social-register-auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ provider: "google", id_token: idToken }),
        }
      )
      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem("customer_name", data.data?.username || "")
        localStorage.setItem("customer_email", data.data?.email || "")
        router.push("/customer")
        return
      }

      setGoogleError(data.message || "Google registration failed. Please try again.")
    } catch {
      setGoogleError("Failed to process Google registration. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

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
            Customer portal to track your points, activity, and rewards
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
        className="flex-1 relative flex flex-col items-center justify-center p-5 sm:p-8 lg:p-12
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
            <h1 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Create New Account</h1>
            <p className="text-[13px] text-[#6b6b6b] mt-1">
              Register and start earning your points
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <p className="text-sm text-[#6b6b6b]">
              Please complete your details to create a customer account.
            </p>
          </div>

          {/* back to login */}
          <button
            onClick={() => router.push("/customer/login")}
            className="relative z-10 flex items-center gap-2 text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </button>

          {/* ── Google option ─────────────────────────────── */}
          <div className="mb-6 space-y-3">
            <p className="text-[11px] font-semibold text-[#a0a0a0] uppercase tracking-[0.15em]">
              Choose Method
            </p>
            <GoogleRegisterButton onClick={handleGoogleRegister} loading={googleLoading} />
            {googleError && <ErrorBanner message={googleError} />}
          </div>

          {/* divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-black/[0.06]" />
            <span className="text-[10px] text-[#a0a0a0] uppercase tracking-[0.2em] font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-black/[0.06]" />
          </div>

          {/* ── manual form ───────────────────────────────── */}
          {manualSuccess ? (
            <SuccessBanner text={manualSuccess} />
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              {manualError && <ErrorBanner message={manualError} />}

              {/* Name */}
              <Field label="Full Name" icon={<User className="w-3.5 h-3.5" />}>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  disabled={manualLoading}
                  className={`${inputCls} pl-9`}
                />
              </Field>

              {/* Email */}
              <Field label="Email" icon={<Mail className="w-3.5 h-3.5" />}>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={manualLoading}
                  className={`${inputCls} pl-9`}
                />
              </Field>

              {/* Phone */}
              <Field label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                <Input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  maxLength={15}
                  disabled={manualLoading}
                  className={`${inputCls} pl-9`}
                />
              </Field>

              {/* TOS note */}
              <p className="text-[11px] text-[#8a8a8a] leading-relaxed">
                By registering, you agree to the{" "}
                <span className="text-[#6b6b6b]">Privacy Policy</span> and{" "}
                <span className="text-[#6b6b6b]">Terms &amp; Conditions</span>{" "}
                of Point Management.
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700
                           text-white font-semibold text-[15px]
                           shadow-sm shadow-blue-600/20
                           active:scale-[0.99] transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Register Now"
                )}
              </button>

              {/* already have account */}
              <p className="text-center text-[13px] text-[#6b6b6b]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/customer/login")}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Log in here
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
