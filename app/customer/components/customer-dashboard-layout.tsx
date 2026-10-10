"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LayoutDashboard } from "lucide-react"
import { CustomerSidebar } from "./customer-sidebar"

export function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const currentLabel = pathname === "/customer"
    ? "Dashboard"
    : pathname === "/customer/account"
    ? "Account"
    : pathname === "/customer/orders"
    ? "Orders"
    : pathname === "/customer/reward"
    ? "Reward"
    : pathname === "/customer/address"
    ? "Address"
    : ""

  return (
    <div
      className="min-h-[100dvh] flex"
      style={{
        backgroundColor: "#0B1120",
        backgroundImage: "url(/images/login-bg-right.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <CustomerSidebar
        customerName={customerName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-black/[0.08] bg-white/40 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800">{currentLabel || "Point Management"}</span>
          <div className="w-5" />
        </div>

        <main className="flex-1 overflow-y-auto p-6 text-slate-800">
          {children}
        </main>
      </div>
    </div>
  )
}
