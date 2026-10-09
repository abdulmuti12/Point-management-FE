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
      <h1 className="text-xl font-bold">Pesanan Saya</h1>
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
        <ShoppingBag className="w-10 h-10 mx-auto text-slate-700 mb-3" />
        <p className="text-slate-500 text-sm">Belum ada pesanan.</p>
        <p className="text-slate-600 text-xs mt-1">
          Pesanan Anda akan tampil di sini setelah melakukan pembelian.
        </p>
      </div>
    </div>
  )
}
