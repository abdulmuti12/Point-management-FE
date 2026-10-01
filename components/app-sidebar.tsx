"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Users,
  UserCheck,
  Package,
  Tag,
  Home,
  Settings,
  Award,
  Megaphone,
  FileText,
  Gift,
  Mail,
  Palette,
  CheckCircle2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

type MenuItem = {
  id: number
  name: string
  route: string
}

type SidebarItem = {
  id: number
  title: string
  url: string
  icon: typeof Home
}

const defaultMenuItems = [
  { id: 1, title: "Dashboard", url: "/dashboard", icon: Home },
  { id: 2, title: "Customers", url: "/dashboard/customers", icon: Users },
  { id: 3, title: "Admin", url: "/dashboard/admin", icon: Users },
  { id: 4, title: "Role", url: "/dashboard/role", icon: UserCheck },
  { id: 5, title: "Product", url: "/dashboard/product", icon: Package },
  { id: 6, title: "Brand", url: "/dashboard/brand", icon: Award },
  { id: 7, title: "Category", url: "/dashboard/category", icon: Tag },
  { id: 8, title: "Campaign", url: "/dashboard/campaign", icon: Megaphone },
  { id: 9, title: "Material", url: "/dashboard/material", icon: FileText },
  { id: 10, title: "Promotion", url: "/dashboard/promotion", icon: Gift },
  { id: 11, title: "Contact Us", url: "/dashboard/contact-us", icon: Mail },
  { id: 12, title: "Logo", url: "/dashboard/logo", icon: Palette },
  { id: 13, title: "Point Customer", url: "/dashboard/point-customer", icon: Award },
  { id: 14, title: "Gift", url: "/dashboard/gift", icon: Package },
  { id: 15, title: "Approval Klaim", url: "/dashboard/approval", icon: CheckCircle2 },
  { id: 16, title: "Member Level", url: "/dashboard/member_level", icon: Award },
]

const iconByRoute: Record<string, typeof Home> = {
  dashboard: Home,
  "dashboard/customers": Users,
  "dashboard/admin": Users,
  "dashboard/role": UserCheck,
  "dashboard/product": Package,
  "dashboard/brand": Award,
  "dashboard/category": Tag,
  "dashboard/campaign": Megaphone,
  "dashboard/material": FileText,
  "dashboard/promotion": Gift,
  "dashboard/contact-us": Mail,
  "dashboard/logo": Palette,
  "dashboard/point-customer": Award,
  "dashboard/gift": Package,
  "dashboard/approval": CheckCircle2,
  "dashboard/member_level": Award,
}

const getSafeUrl = (route: string) => (route.startsWith("/") ? route : `/${route}`)

export function AppSidebar() {
  const [menuItems, setMenuItems] = useState<SidebarItem[]>(defaultMenuItems)

  useEffect(() => {
    const storedMenus = localStorage.getItem("user_menus")
    if (!storedMenus) return

    try {
      const parsedMenus: MenuItem[] = JSON.parse(storedMenus)
      if (!Array.isArray(parsedMenus) || parsedMenus.length === 0) return

      const dynamicMenus = parsedMenus.map((menu) => {
        const normalizedRoute = menu.route.replace(/^\//, "")
        return {
          id: menu.id,
          title: menu.name,
          url: getSafeUrl(normalizedRoute),
          icon: iconByRoute[normalizedRoute] || FileText,
        }
      })

      setMenuItems(dynamicMenus)
    } catch (error) {
      console.error("Failed to parse user menus:", error)
    }
  }, [])

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Admin Panel</h2>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    className="w-full justify-start px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                  >
                    <Link href={item.url} className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        <div className="text-xs text-slate-500 text-center">© 2025 Marcomm Team</div>
      </SidebarFooter>
    </Sidebar>
  )
}
