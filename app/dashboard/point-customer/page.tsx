"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Award,
  Mail,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  History,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PointCustomer {
  id: string
  customer: {
    id: string
    name: string
    full_name: string
    email: string
    phone_number: string
  }
  point: {
    id: string
    name: string
    status: string
    price_point: number
    range_point: number
    point: number
  } | null
  total_transaction: number
  total_point: number
  total_point_active: number
  total_point_closed: number
  created_at: string
  updated_at: string
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface ApiResponse {
  success: boolean
  message: string
  data: {
    data: PointCustomer[]
    meta: {
      current_page: number
      from: number
      last_page: number
      links: PaginationLink[]
      path: string
      per_page: number
      to: number
      total: number
    }
    links: {
      first: string | null
      last: string | null
      prev: string | null
      next: string | null
    }
  }
  status: number
}

interface ToastNotification {
  id: string
  type: "success" | "error"
  title: string
  message: string
}

export default function PointCustomerPage() {
  const [pointCustomers, setPointCustomers] = useState<PointCustomer[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [apiError, setApiError] = useState("")
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const router = useRouter()

  // Toast notification helpers
  const addToast = (type: "success" | "error", title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  // Format helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatNumber = (n: number) => {
    return new Intl.NumberFormat("id-ID").format(n || 0)
  }

  // Fetch data
  const fetchPointCustomers = async (page = 1, value = "") => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setApiError("No authentication token found. Please login.")
        setIsLoading(false)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      setApiError("")

      const params = new URLSearchParams()
      if (page > 1) params.append("page", page.toString())
      if (value.trim()) {
        params.append("search", value.trim())
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/redeem-point${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      let responseData: ApiResponse | any
      try {
        responseData = await response.json()
      } catch (parseError) {
        setApiError(`Failed to parse server response. Status: ${response.status}`)
        setPointCustomers([])
        return
      }

      if (response.ok) {
        // The endpoint nests pagination data inside data.data (extra level)
        const container = responseData?.data?.data
        const records: PointCustomer[] = container?.data ?? []
        const meta = container?.meta

        setPointCustomers(records)
        setCurrentPage(meta?.current_page || 1)
        setTotalPages(meta?.last_page || 1)
        setTotalItems(meta?.total || records.length)
        setPerPage(meta?.per_page || 10)
      } else {
        setApiError(responseData?.message || `Failed to fetch data. Status: ${response.status}`)
        setPointCustomers([])
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setApiError("Network error. Please check your connection and try again.")
      setPointCustomers([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchPointCustomers(1, "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handlers
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    fetchPointCustomers(page, searchValue)
  }

  const handleSearch = () => {
    fetchPointCustomers(1, searchValue)
  }

  const handleClearSearch = () => {
    setSearchValue("")
    fetchPointCustomers(1, "")
  }

  const handleRefresh = () => {
    fetchPointCustomers(currentPage, searchValue)
  }

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  // Stats summary
  const totalAllTransactions = pointCustomers.reduce((sum, p) => sum + (p.total_transaction || 0), 0)
  const totalAllPoints = pointCustomers.reduce((sum, p) => sum + (p.total_point || 0), 0)
  const totalAllActive = pointCustomers.reduce((sum, p) => sum + (p.total_point_active || 0), 0)
  const totalAllClosed = pointCustomers.reduce((sum, p) => sum + (p.total_point_closed || 0), 0)

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Point Customer</h1>
            <p className="text-slate-600 mt-2">Loading data...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <Card key={idx} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded animate-pulse w-20 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-28"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white shadow-lg rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5 border-l-4 ${
              toast.type === "success" ? "border-green-500" : "border-red-500"
            }`}
          >
            <div className="p-3">
              <div className="font-semibold text-slate-900">{toast.title}</div>
              <div className="text-sm text-slate-600 mt-1">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Point Customer</h1>
          <p className="text-slate-600 mt-2">Daftar perolehan poin dari setiap customer</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isSearching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isSearching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* API Error */}
      {apiError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Customer</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(totalItems)}</div>
            <p className="text-xs text-slate-500 mt-1">Customer terdaftar</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalAllTransactions)}</div>
            <p className="text-xs text-slate-500 mt-1">Akumulasi transaksi (halaman ini)</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Point Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatNumber(totalAllActive)}</div>
            <p className="text-xs text-slate-500 mt-1">Poin aktif (halaman ini)</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Point Closed</CardTitle>
            <XCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(totalAllClosed)}</div>
            <p className="text-xs text-slate-500 mt-1">Poin closed (halaman ini)</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-slate-900">Daftar Point Customer</CardTitle>
              <CardDescription>
                {totalItems > 0
                  ? `Menampilkan ${(currentPage - 1) * perPage + 1}-${Math.min(
                      currentPage * perPage,
                      totalItems,
                    )} dari ${totalItems} data`
                  : "Belum ada data"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari customer..."
                  className="pl-9 w-64"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch()
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                Cari
              </Button>
              {searchValue && (
                <Button variant="outline" onClick={handleClearSearch} disabled={isSearching}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total Transaction</TableHead>
                  <TableHead className="text-right">Total Point</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Closed</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSearching ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : pointCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      {searchValue
                        ? `Tidak ada customer cocok dengan "${searchValue}".`
                        : "Belum ada data point customer."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pointCustomers.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-slate-500">
                        {(currentPage - 1) * perPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                            {(item.customer?.full_name || item.customer?.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {item.customer?.full_name || item.customer?.name || "-"}
                            </div>
                            <div className="text-xs text-slate-500">{item.customer?.phone_number || "-"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm">{item.customer?.email || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatCurrency(item.total_transaction)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-semibold text-slate-900">
                            {formatNumber(item.total_point)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          {formatNumber(item.total_point_active)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="h-3 w-3" />
                          {formatNumber(item.total_point_closed)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/point-customer/histories/${item.customer?.id || '?'}`)}
                          disabled={!item.point?.id}
                          title={item.point?.id ? `Lihat history (${item.point.id})` : "Point rule tidak tersedia"}
                        >
                          <History className="h-3.5 w-3.5 mr-1" />
                          History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isSearching}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, idx) =>
                    typeof page === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                        …
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        disabled={isSearching}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isSearching}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
