"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Mail, Shield, User, Clock, Info, CheckCircle } from "lucide-react"

interface UserData {
  id: number
  name: string
  email: string
  status: string
  last_login: string
  created_at: string
  updated_at: string
  role: string
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/login")
          return
        }
        // http://127.0.0.1:8000/api/admins/me
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token")
            router.push("/login")
            return
          }
          throw new Error(data.message || "Failed to fetch user data")
        }

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch user data")
        }

        setUserData(data.data)
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching user data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-200"
    }
  }

  const getRoleColor = (role: string) => {
    if (role.toLowerCase().includes("admin")) {
      return "bg-purple-100 text-purple-800 hover:bg-purple-200"
    }
    if (role.toLowerCase().includes("super")) {
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    }
    return "bg-slate-100 text-slate-800 hover:bg-slate-200"
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Information</h1>
          <p className="text-slate-500 mt-1">View and manage your personal account details</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex items-center gap-2 h-10">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-6">
          <AccountLoadingSkeleton />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-6 py-8 border-b border-slate-200">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-sm">
                  <User className="h-12 w-12 text-slate-600" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-900">{userData?.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    {userData?.role && <Badge className={getRoleColor(userData.role)}>{userData.role}</Badge>}
                    {userData?.status && (
                      <Badge className={getStatusColor(userData.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {userData.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5 text-slate-500" />
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </div>
                        <p className="mt-1 text-base text-slate-900">{userData?.email}</p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Shield className="h-4 w-4" />
                          User ID
                        </div>
                        <p className="mt-1 text-base text-slate-900">{userData?.id}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-500" />
                      Login Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Calendar className="h-4 w-4" />
                          Last Login
                        </div>
                        <p className="mt-1 text-base text-slate-900">
                          {userData?.last_login ? formatDate(userData.last_login) : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-slate-500" />
                      Account Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Calendar className="h-4 w-4" />
                          Account Created
                        </div>
                        <p className="mt-1 text-base text-slate-900">
                          {userData?.created_at ? formatDate(userData.created_at) : "Unknown"}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Calendar className="h-4 w-4" />
                          Last Updated
                        </div>
                        <p className="mt-1 text-base text-slate-900">
                          {userData?.updated_at ? formatDate(userData.updated_at) : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function AccountLoadingSkeleton() {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="bg-slate-50 px-6 py-8 border-b border-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="text-center md:text-left">
            <Skeleton className="h-8 w-48 mb-2" />
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-7 w-48 mb-4" />
              <div className="space-y-4">
                <div className="flex flex-col">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <div className="flex flex-col">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Skeleton className="h-7 w-48 mb-4" />
              <div className="space-y-4">
                <div className="flex flex-col">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Skeleton className="h-7 w-48 mb-4" />
              <div className="space-y-4">
                <div className="flex flex-col">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <div className="flex flex-col">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
