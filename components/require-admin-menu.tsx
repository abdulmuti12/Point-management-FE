"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Each admin page URL is mapped to a `menus.url` value (the DB column, also
 * sent by the API as `route` in the login response and stored in
 * localStorage "user_menus"). If the user's role does not have that menu,
 * the page is fully blocked before any data request.
 *
 * null = the page is always allowed (dashboard).
 */
const ADMIN_PAGE_MENU: Record<string, string | null> = {
  "/admin": "admin",
  "/admin/admin": "admin/admin",
  "/admin/account": null, // every logged-in admin can view their own profile
  "/admin/role": "admin/role",
  "/admin/category": "admin/category",
  "/admin/brand": "admin/brand",
  "/admin/customers": "admin/customers",
  "/admin/order": "admin/order",
  "/admin/campaign": "admin/campaign",
  "/admin/contact-us": "admin/contact-us",
  "/admin/logo": "admin/logo",
  "/admin/point": "admin/point",
  "/admin/point-customer": "admin/point-customer",
  "/admin/gift": "admin/gift",
  "/admin/approval": "admin/approval",
  "/admin/member_level": "admin/member_level",
}

export function RequireAdminMenu({ path, children }: { path: string; children: ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const needed = ADMIN_PAGE_MENU[path] ?? ""
    let stored: string = ""
    try {
      stored = localStorage.getItem("user_menus") || "[]"
    } catch {
      stored = "[]"
    }
    let menus: { route?: unknown }[] = []
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) menus = parsed
    } catch {
      menus = []
    }
    const routes = menus.map((m) => String(m?.route ?? "").toLowerCase())
    if (!needed) {
      setAllowed(true)
      return
    }
    setAllowed(routes.includes(needed.toLowerCase()))
  }, [path])

  if (allowed === null) return null

  if (allowed) return <>{children}</>

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
      <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
        <ShieldX className="w-7 h-7" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Your account does not have access to this page. Contact an administrator to request
          the appropriate permission, or return to the dashboard.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
        Return to Dashboard
      </Button>
    </div>
  )
}
