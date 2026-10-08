"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const adminToken = localStorage.getItem("token")
        const customerToken = localStorage.getItem("customer_token")

        if (customerToken) {
          router.push("/customer")
        } else if (adminToken) {
          router.push("/admin")
        } else {
          router.push("/customer/login")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/customer/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
