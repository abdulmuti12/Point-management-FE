"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { User, LogOut, Settings, Bell } from "lucide-react"

export function DashboardHeader() {
  const router = useRouter()
  const [userName, setUserName] = useState("Admin User")
  const [userEmail, setUserEmail] = useState("admin@example.com")

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "Admin User")
    setUserEmail(localStorage.getItem("user_email") || "admin@example.com")
  }, [])

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user_menus")
    localStorage.removeItem("user_name")
    localStorage.removeItem("user_email")

    // Redirect to login page
    router.push("/login")
  }

  const handleAccountInfo = () => {
    router.push("/admin/account")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-slate-600 hover:text-slate-900" />
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-slate-200">
                  <AvatarFallback className="bg-slate-100 text-slate-700 font-medium">{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleAccountInfo}>
                <User className="mr-2 h-4 w-4" />
                <span>Account Information
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
