"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Mail,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

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
    script.onerror = () => reject(new Error("Gagal memuat Google SDK"))
    document.head.appendChild(script)
  })
}

/* ── field styles ───────────────────────────────────────────── */
const inputCls = `
  h-11 bg-white/[0.03] border border-white/[0.08]
  text-white/90 text-[14px] placeholder:text-slate-600
  rounded-lg outline-none
  focus:bg-white/[0.06] focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20
  transition-all disabled:opacity-40
`

const labelCls =
  "text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em] mb-1.5 block"

/* ── shared small pieces ────────────────────────────────────── */
function SuccessBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-px" />
      <p className="text-[13px] text-emerald-400/80 leading-relaxed">{text}</p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-500/[0.08] border border-red-500/20">
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
      <p className="text-[13px] text-red-400/90 leading-relaxed">{message}</p>
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
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

/* ── Google register button ─────────────────────────────────── */
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
      className="w-full h-11 rounded-lg
                 bg-white/[0.04] border border-white/[0.08]
                 flex items-center justify-center gap-3
                 hover:bg-white/[0.08] hover:border-white/[0.15]
                 active:scale-[0.99] transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-amber-400/70" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.72.13-1.42.34-2.1V7.06H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.44 1.18 4.94l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      )}
      <span className="text-[13px] font-medium text-slate-300">
        {loading ? "Menghubungkan ke Google…" : "Daftar dengan Google"}
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

  const [showName, setShowName] = useState(false)

  /* ── manual register → POST /api/customers/register ───────── */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualLoading(true)
    setManualError("")
    setManualSuccess("")

    try {
      const res = await fetch(`${API_BASE_URL}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          "Akun berhasil didaftarkan. Password sementara telah dikirim ke email Anda. Silakan login menggunakan password yang diterima."
        )
        return
      }

      // duplicate field errors
      if (data.duplicate_fields?.length) {
        const field: string = data.duplicate_fields[0]
        const msg =
          field === "email"
            ? "Email sudah terdaftar di sistem. Silakan gunakan email lain atau login langsung."
            : "Nomor telepon sudah terdaftar. Silakan gunakan nomor lain."
        setManualError(msg)
        return
      }

      setManualError(data.message || "Registrasi gagal. Silakan coba lagi.")
    } catch {
      setManualError("Terjadi kesalahan jaringan. Silakan coba lagi.")
    } finally {
      setManualLoading(false)
    }
  }

  /* ── Google register → POST /api/customers/social-register-auth ── */
  const handleGoogleRegister = useCallback(async () => {
    setGoogleLoading(true)
    setGoogleError("")

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      setGoogleError(
        "Login Google belum dikonfigurasi. Hubungi admin untuk mengatur Google OAuth."
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
        `${API_BASE_URL}/customers/social-register-auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "google", id_token: idToken }),
        }
      )
      const data = await res.json()

      if (res.ok && data.success && data.data?.token) {
        localStorage.setItem("customer_token", data.data.token)
        localStorage.setItem("customer_name", data.data.username || "")
        localStorage.setItem("customer_email", data.data.email || "")
        router.push("/customer")
        return
      }

      setGoogleError(data.message || "Registrasi Google gagal. Silakan coba lagi.")
    } catch {
      setGoogleError("Gagal memproses registrasi Google. Silakan coba lagi.")
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

  return (
    <div className="min-h-[100dvh] bg-[#0A0E1A] text-white relative overflow-hidden flex flex-col">

      {/* ambient glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full
                      bg-amber-500/[0.04] blur-[140px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full
                      bg-blue-500/[0.04] blur-[120px] pointer-events-none translate-x-1/4 translate-y-1/4" />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <button
          onClick={() => router.push("/customer/login")}
          className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-amber-400/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Login
        </button>
        <p className="text-[11px] tracking-[0.2em] text-slate-700 uppercase font-semibold hidden sm:block">
          Point Management
        </p>
      </header>

      <main className="relative z-10 flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 py-10 lg:py-0">
        <div className="w-full max-w-[440px]">

          {/* heading */}
          <div className="mb-10 lg:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.15]
                              flex items-center justify-center">
                <User className="w-4 h-4 text-amber-400/70" />
              </div>
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-white/95 leading-tight">
                  Buat Akun Baru
                </h1>
                <p className="text-[12px] text-slate-600 mt-0.5">
                  Daftar dan mulai kumpulkan poin Anda
                </p>
              </div>
            </div>
          </div>

          {/* card */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06]
                          backdrop-blur-sm overflow-hidden">

            {/* subtle top border accent */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

            <div className="p-6 sm:p-8 space-y-7">

              {/* ── Google option ─────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.15em]">
                  Pilih Metode
                </p>

                <GoogleRegisterButton
                  onClick={handleGoogleRegister}
                  loading={googleLoading}
                />

                {googleError && <ErrorBanner message={googleError} />}
              </div>

              {/* divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-slate-700 uppercase tracking-[0.2em] font-medium">
                  atau
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* ── manual form ───────────────────────────────── */}
              {manualSuccess ? (
                <SuccessBanner text={manualSuccess} />
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-5">

                  {manualError && <ErrorBanner message={manualError} />}

                  {/* Name */}
                  <Field
                    label="Nama Lengkap"
                    icon={<User className="w-3.5 h-3.5" />}
                  >
                    <Input
                      type="text"
                      placeholder="Nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      disabled={manualLoading}
                      className={`${inputCls} pl-9`}
                    />
                  </Field>

                  {/* Email */}
                  <Field
                    label="Email"
                    icon={<Mail className="w-3.5 h-3.5" />}
                  >
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
                  <Field
                    label="Nomor Telepon"
                    icon={<Phone className="w-3.5 h-3.5" />}
                  >
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
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Dengan mendaftar, Anda menyetujui{" "}
                    <span className="text-slate-500">Kebijakan Privasi</span> dan{" "}
                    <span className="text-slate-500">Syarat & Ketentuan</span>{" "}
                    dari Point Management.
                  </p>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={manualLoading}
                    className="w-full h-11 rounded-lg
                               bg-gradient-to-r from-amber-500 to-amber-400
                               text-[#0A0E1A] font-semibold text-[14px]
                               tracking-wide
                               shadow-lg shadow-amber-500/[0.15]
                               hover:from-amber-400 hover:to-amber-300
                               active:scale-[0.99] transition-all
                               disabled:opacity-40 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                  >
                    {manualLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim…
                      </>
                    ) : (
                      "Daftar Sekarang"
                    )}
                  </button>

                  {/* already have account */}
                  <p className="text-center text-[12px] text-slate-700">
                    Sudah punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/customer/login")}
                      className="text-amber-400/80 hover:text-amber-300 font-medium transition-colors"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* footer */}
          <p className="text-center text-[10px] text-slate-800 mt-8 tracking-wider">
            &copy; {new Date().getFullYear()} Point Management — All rights reserved
          </p>
        </div>
      </main>
    </div>
  )
}
