"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  User,
  ShoppingBag,
  Gift,
  MapPin,
  LogOut,
  X,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Account", icon: User, href: "/customer/account" },
  { label: "Orders", icon: ShoppingBag, href: "/customer/orders" },
  { label: "Reward", icon: Gift, href: "/customer/reward" },
  { label: "Address", icon: MapPin, href: "/customer/address" },
]

interface CustomerSidebarProps {
  customerName: string
  mobileOpen: boolean
  onMobileClose: () => void
}

export function CustomerSidebar({
  customerName,
  mobileOpen,
  onMobileClose,
}: CustomerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("customer_token")
    localStorage.removeItem("customer_name")
    localStorage.removeItem("customer_email")
    router.push("/customer/login")
  }

  const handleNavClick = (href: string) => {
    router.push(href)
    onMobileClose()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-black/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/[0.1] border border-blue-600/[0.2]
                          flex items-center justify-center text-blue-600 font-bold text-sm">
            {customerName ? customerName.charAt(0).toUpperCase() : "P"}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
              {customerName}
            </p>
            <p className="text-[11px] text-slate-500">Customer Portal</p>
          </div>
        </div>
        <button
          onClick={onMobileClose}
          className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = pathname === href
          return (
            <button
              key={href}
              onClick={() => handleNavClick(href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                         text-[14px] font-medium transition-colors
                         ${
                           active
                             ? "bg-blue-600/[0.12] text-blue-700"
                             : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/[0.04]"
                         }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-black/[0.08]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                     text-[14px] font-medium text-slate-600
                     hover:text-red-600 hover:bg-red-500/[0.06] transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0
                        border-r border-black/[0.08] bg-white/40 backdrop-blur">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 lg:hidden w-[240px] h-full
                    bg-white/80 backdrop-blur border-r border-black/[0.08]
                    transition-transform duration-200
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
