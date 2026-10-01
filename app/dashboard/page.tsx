"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShoppingBag, Package, Tag, Award, UserCheck } from "lucide-react"

interface DashboardData {
  total_products: number
  total_categories: number
  total_brands: number
  total_customers: number
  total_admins: number
  total_role: number
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          router.push("/login")
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/dashboard`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setDashboardData(data.data)
        } else {
          // If API returns success: false or any error, redirect to login
          localStorage.removeItem("token")
          router.push("/login")
        }
      } catch (error) {
        console.error("Dashboard API error:", error)
        // On network error, also redirect to login
        localStorage.removeItem("token")
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Loading dashboard data...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null // Will redirect to login
  }

  const stats = [
    {
      title: "Total Products",
      value: String(dashboardData.total_products ?? 0),
      description: "All products in system",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Total Categories",
      value: String(dashboardData.total_categories ?? 0),
      description: "Product categories",
      icon: Tag,
      color: "text-green-600",
    },
    {
      title: "Total Brands",
      value: String(dashboardData.total_brands ?? 0),
      description: "Registered brands",
      icon: Award,
      color: "text-purple-600",
    },
    {
      title: "Total Customers",
      value: String(dashboardData.total_customers ?? 0),
      description: "Registered customers",
      icon: Users,
      color: "text-orange-600",
    },
    {
      title: "Total Admins",
      value: String(dashboardData.total_admins ?? 0),
      description: "Admin users",
      icon: UserCheck,
      color: "text-red-600",
    },
    {
      title: "Total Roles",
      value: String(dashboardData.total_role ?? 0),
      description: "User roles",
      icon: ShoppingBag,
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back! Here's what's happening with your admin panel.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">System Overview</CardTitle>
            <CardDescription>Current system statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Products</span>
                </div>
                <span className="text-sm text-slate-600">{dashboardData.total_products ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Categories</span>
                </div>
                <span className="text-sm text-slate-600">{dashboardData.total_categories ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Brands</span>
                </div>
                <span className="text-sm text-slate-600">{dashboardData.total_brands ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">User Management</CardTitle>
            <CardDescription>Users and roles overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Customers</span>
                </div>
                <span className="text-sm text-slate-600">{dashboardData.total_customers ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Admins</span>
                </div>
                <span className="text-sm text-slate-600">{dashboardData.total_admins ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Roles</span>
                </div>
                <span className="text-sm text-slate-600">{dashboardData.total_role ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Manage Products</p>
                <p className="text-xs text-slate-500">Add, edit, or remove products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Manage Categories</p>
                <p className="text-xs text-slate-500">Organize product categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Manage Users</p>
                <p className="text-xs text-slate-500">Handle user accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
