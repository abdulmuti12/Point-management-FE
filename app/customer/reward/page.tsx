"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gift } from "lucide-react"

export default function CustomerRewardPage() {
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem("customer_token")) {
      router.push("/customer/login")
    }
  }, [router])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Reward</h1>
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
        <Gift className="w-10 h-10 mx-auto text-slate-700 mb-3" />
        <p className="text-slate-500 text-sm">Belum ada reward tersedia.</p>
        <p className="text-slate-600 text-xs mt-1">
          Reward yang tersedia akan ditampilkan di sini.
        </p>
      </div>
    </div>
  )
}
