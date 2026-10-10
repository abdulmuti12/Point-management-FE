"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag } from "lucide-react"

export default function CustomerOrdersPage() {
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem("customer_token")) {
      router.push("/customer/login")
    }
  }, [router])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Pesanan Saya</h1>
      <div className="rounded-xl bg-white/50 border border-black/[0.08] p-8 text-center backdrop-blur-sm">
        <ShoppingBag className="w-10 h-10 mx-auto text-slate-500 mb-3" />
        <p className="text-slate-600 text-sm">Belum ada pesanan.</p>
        <p className="text-slate-500 text-xs mt-1">
          Pesanan Anda akan tampil di sini setelah melakukan pembelian.
        </p>
      </div>
    </div>
  )
}
