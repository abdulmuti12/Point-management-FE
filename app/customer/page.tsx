"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function CustomerDashboardPage() {
  const [isAuth, setIsAuth] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("customer_token")
    if (!token) {
      router.push("/customer/login")
      return
    }
    setCustomerName(localStorage.getItem("customer_name") || "Pelanggan")
    setIsAuth(true)
  }, [router])

  if (!isAuth) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto" />
          <p className="mt-4 text-slate-500 text-sm">Memuat…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B1120] text-white">
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <h1 className="text-lg font-semibold">Point Management</h1>
        <button
          onClick={() => {
            localStorage.removeItem("customer_token")
            localStorage.removeItem("customer_name")
            localStorage.removeItem("customer_email")
            router.push("/customer/login")
          }}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Keluar
        </button>
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-2">Halo, {customerName}!</h2>
        <p className="text-slate-400 text-sm">
          Halaman dashboard pelanggan Anda akan tampil di sini.
        </p>
      </div>
    </div>
  )
}
