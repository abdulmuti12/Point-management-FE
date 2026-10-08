"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Key } from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

export default function SetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [setupToken, setSetupToken] = useState<string | null>(null)
  const [setupEmail, setSetupEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    setSetupToken(localStorage.getItem("setup_token"))
    setSetupEmail(localStorage.getItem("setup_email") || "")
  }, [])

  const inputCls = `
    h-12 bg-white/[0.04] border border-white/10
    text-white text-[15px] placeholder:text-slate-600
    rounded-xl outline-none
    focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
    transition-colors disabled:opacity-50
  `

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${API_BASE_URL}/customers/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup_token: setupToken,
          email: setupEmail,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem("customer_token", data.data?.token)
        localStorage.setItem("customer_name", data.data?.username || setupEmail.split("@")[0])
        localStorage.setItem("customer_email", data.data?.email || setupEmail)
        localStorage.removeItem("setup_token")
        localStorage.removeItem("setup_email")
        setSuccess(true)
        setTimeout(() => router.push("/customer"), 1500)
      } else {
        setError(data.message || "Gagal mengatur password. Silakan login ulang.")
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B1120] flex items-center justify-center p-5">
      <div className="w-full max-w-[380px]">
        <h1 className="text-xl font-bold mb-1">Atur Password Baru</h1>
        <p className="text-sm text-slate-500 mb-6">
          Akun Anda baru diaktifkan. Silakan buat password untuk melanjutkan.
        </p>

        {success ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            Password berhasil diatur. Mengalihkan ke dashboard…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="new_password"
                className="text-[13px] font-medium text-slate-400"
              >
                Password Baru
              </Label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className={`${inputCls} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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

            <div className="space-y-1.5">
              <Label
                htmlFor="confirm_password"
                className="text-[13px] font-medium text-slate-400"
              >
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500
                         text-white font-semibold text-[15px]
                         rounded-xl shadow-lg shadow-blue-600/25
                         active:scale-[0.98] transition-all
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses…
                </span>
              ) : (
                "Simpan Password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
