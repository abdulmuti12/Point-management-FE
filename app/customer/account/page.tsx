"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone } from "lucide-react"

export default function CustomerAccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<{
    name: string
    email: string
  }>({ name: "", email: "" })

  useEffect(() => {
    if (!localStorage.getItem("customer_token")) {
      router.push("/customer/login")
      return
    }
    setCustomer({
      name: localStorage.getItem("customer_name") || "",
      email: localStorage.getItem("customer_email") || "",
    })
  }, [router])

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold mb-4">Akun Saya</h1>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/[0.15] border border-blue-500/[0.2]
                            flex items-center justify-center text-blue-400 font-bold text-sm">
              {customer.name ? customer.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <p className="text-white font-medium">{customer.name || "—"}</p>
              <p className="text-slate-500 text-xs">Pelanggan</p>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <User className="w-4 h-4 shrink-0" />
              <span>{customer.name || "Nama tidak diketahui"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <Mail className="w-4 h-4 shrink-0" />
              <span>{customer.email || "Email tidak diketahui"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
