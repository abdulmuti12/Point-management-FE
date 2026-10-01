"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
  ? `${process.env.NEXT_PUBLIC_STORAGE_URL.replace(/\/$/, "")}/`
  : API_BASE_URL
    ? `${API_BASE_URL.replace(/\/api$/, "")}/storage/`
    : "http://127.0.0.1:8000/storage/"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const router = useRouter()

  const getLogoUrl = (filePath: string) => {
    if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("/")) {
      return filePath
    }

    return `${STORAGE_BASE_URL}${filePath}`
  }

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admins/active-logo`)
        const data = await response.json()

        if (data.success && data.data?.image) {
          setLogoUrl(getLogoUrl(data.data.image))
        }
      } catch (error) {
        console.error("Gagal fetch logo:", error)
      }
    }

    fetchLogo()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/admins/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("user_menus", JSON.stringify(data.data.menus || []))
        localStorage.setItem("user_name", data.data.name || email.split("@")[0])
        localStorage.setItem("user_email", data.data.email || email)
        setMessage(data.message || "Login berhasil!")

        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        setMessage(data.message || "Login gagal")
      }
    } catch (error) {
      setMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto flex flex-col items-center">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Casa Italia"
                className="mb-4 h-[70px] w-[140px] object-contain"
              />
            )}
          </div>

          <CardDescription className="text-slate-600">Sign in to your admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                className={`p-3 rounded-lg text-center text-sm ${
                  message.includes("berhasil") || message.includes("success")
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
