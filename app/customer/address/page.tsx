"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus } from "lucide-react"

export default function CustomerAddressPage() {
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem("customer_token")) {
      router.push("/customer/login")
    }
  }, [router])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Alamat Saya</h1>
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400
                     hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Alamat
        </button>
      </div>
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
        <MapPin className="w-10 h-10 mx-auto text-slate-700 mb-3" />
        <p className="text-slate-500 text-sm">Belum ada alamat tersimpan.</p>
        <p className="text-slate-600 text-xs mt-1">
          Tambahkan alamat pengiriman Anda untuk kemudahan transaksi.
        </p>
      </div>
    </div>
  )
}
