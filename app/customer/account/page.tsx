"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, ShieldCheck, Shield } from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
  ? `${process.env.NEXT_PUBLIC_STORAGE_URL.replace(/\/$/, "")}/`
  : API_BASE_URL
    ? `${API_BASE_URL.replace(/\/api$/, "")}/storage/`
    : "http://127.0.0.1:8000/storage/"

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-600/[0.08] flex items-center justify-center text-blue-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 truncate">{children}</p>
      </div>
    </div>
  )
}

function resolveAvatarUrl(filePath: string | null) {
  if (!filePath) return ""
  if (/^https?:\/\//.test(filePath) || filePath.startsWith("/")) return filePath
  return `${STORAGE_BASE_URL}${filePath}`
}

type MeData = {
  name: string
  full_name: string
  email: string
  phone_number: string
  avatar: string | null
  provider: string
  email_verified_at: string | null
  status: string
}

export default function CustomerAccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<MeData>({
    name: "",
    full_name: "",
    email: "",
    phone_number: "",
    avatar: null,
    provider: "",
    email_verified_at: null,
    status: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("customer_token")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const fallback = (): MeData => ({
      name: localStorage.getItem("customer_name") || "",
      full_name: "",
      email: localStorage.getItem("customer_email") || "",
      phone_number: "",
      avatar: null,
      provider: "",
      email_verified_at: null,
      status: "",
    })

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/customers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const me = data.data || data
          setCustomer({
            name: me.name || localStorage.getItem("customer_name") || "",
            full_name: me.full_name || "",
            email: me.email || localStorage.getItem("customer_email") || "",
            phone_number: me.phone_number || "",
            avatar: me.avatar || null,
            provider: me.provider || "",
            email_verified_at: me.email_verified_at || null,
            status: me.status || "",
          })
        } else {
          setCustomer(fallback())
        }
      } catch {
        setCustomer(fallback())
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [router])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-slate-500">Memuat akun…</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-4">Akun Saya</h1>
        <div className="rounded-xl bg-white/50 border border-black/[0.08] p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {customer.avatar ? (
              <img
                src={resolveAvatarUrl(customer.avatar)}
                alt={customer.name || "avatar"}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-600/[0.1] border border-blue-600/[0.2]
                              flex items-center justify-center text-blue-600 font-bold text-sm">
                {customer.name ? customer.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-slate-800 font-medium truncate max-w-[180px]">
                  {customer.name || "—"}
                </p>
                {customer.status && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                   bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                    {customer.status}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs truncate max-w-[200px]">{customer.email}</p>
            </div>
          </div>

          <div className="border-t border-black/[0.08] pt-4 space-y-3">
            <InfoRow icon={<User className="w-4 h-4 shrink-0" />} label="Nama Lengkap">
              {customer.full_name || customer.name || "Nama tidak diketahui"}
            </InfoRow>
            <InfoRow icon={<Mail className="w-4 h-4 shrink-0" />} label="Email">
              {customer.email || "Email tidak diketahui"}
            </InfoRow>
            <InfoRow icon={<Phone className="w-4 h-4 shrink-0" />} label="Nomor Telepon">
              {customer.phone_number || "—"}
            </InfoRow>
            <InfoRow icon={<Shield className="w-4 h-4 shrink-0" />} label="Sumber">
              {customer.provider ? customer.provider.charAt(0).toUpperCase() + customer.provider.slice(1) : "—"}
            </InfoRow>
            <InfoRow
              icon={
                customer.email_verified_at ? (
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 shrink-0" />
                )
              }
              label="Verifikasi Email"
            >
              {customer.email_verified_at ? (
                <span className="text-emerald-600">Terverifikasi</span>
              ) : (
                <span className="text-slate-500">Belum diverifikasi</span>
              )}
            </InfoRow>
          </div>
        </div>
      </div>
    </div>
  )
}
