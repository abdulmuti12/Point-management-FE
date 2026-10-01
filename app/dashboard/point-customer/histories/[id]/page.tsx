"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Loader2,
  History,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PointInfo {
  id: string
  name: string
  range_point: number
  point: number
}

interface HistoryRecord {
  id: string
  customer_id: string
  point_id: string
  type: "earn" | "redeem" | "expire" | string
  point_amount: number
  point_balance: number
  status: string
  description: string
  date: string
  transaction_amount: number | null
  point: PointInfo | null
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface HistoriesApiResponse {
  success: boolean
  message: string
  data: {
    data: {
      data: HistoryRecord[]
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
  }
  status: number
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  const s = String(d.getSeconds()).padStart(2, "0")
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0)
}

const getTypeIcon = (type: string) => {
  if (type === "earn") return <ArrowUpRight className="h-4 w-4 text-emerald-500" />
  if (type === "redeem") return <ArrowDownRight className="h-4 w-4 text-amber-500" />
  return <Award className="h-4 w-4 text-slate-400" />
}

const getTypeLabel = (type: string) => {
  if (type === "earn") return "Earn"
  if (type === "redeem") return "Redeem"
  if (type === "expire") return "Expired"
  return type
}

const getStatusBadge = (status: string) => {
  const cls: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    redeemed: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-slate-50 text-slate-600 border-slate-200",
  }
  return cls[status] || "bg-slate-50 text-slate-600 border-slate-200"
}

export default function PointCustomerHistoriesPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = typeof params.id === "string" ? params.id : ""

  // Param name kept as customerId for compatibility, but the API expects the UUID of the point rule
  // (or customer, depending on backend). Both UUID and numeric id formats work per the spec.

  const [histories, setHistories] = useState<HistoryRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [apiError, setApiError] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchHistories = async (page = 1) => {
    if (!customerId) {
      setApiError("No customer ID provided.")
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setApiError("No authentication token found. Please login.")
        setIsLoading(false)
        return
      }

      setIsSearching(true)
      setApiError("")

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/redeem-point/history/${customerId}?page=${page}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        setApiError("Sesi Anda habis. Silakan login ulang untuk mengakses riwayat.")
        setHistories([])
        return
      }

      let responseData: HistoriesApiResponse
      try {
        responseData = await response.json()
      } catch {
        setApiError("Failed to parse server response. Status: " + response.status)
        setHistories([])
        return
      }

      if (response.ok && responseData.success) {
        const container = responseData.data?.data
        const records: HistoryRecord[] = container?.data ?? []
        const meta = container?.meta

        setHistories(records)
        setCurrentPage(meta?.current_page || 1)
        setTotalPages(meta?.last_page || 1)
        setTotalItems(meta?.total || records.length)
        setPerPage(meta?.per_page || 10)

        // Load customer name from /show endpoint
        const showUrl = `${apiBase}/admins/redeem-point/${customerId}`
        try {
          const showRes = await fetch(showUrl, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          })
          if (showRes.ok) {
            const showData = await showRes.json()
            if (showData.success && showData.data.summary.customer) {
              setCustomerName(showData.data.summary.customer.full_name || showData.data.summary.customer.name)
            }
          }
        } catch {
          // Ignore customer name fetch errors
        }
      } else {
        setApiError(responseData?.message || "Failed to fetch history data.")
        setHistories([])
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setApiError("Network error. Please check your connection and try again.")
      setHistories([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchHistories(1)
  }, [customerId])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    fetchHistories(page)
  }

  const handleBack = () => {
    router.push("/dashboard/point-customer")
  }

  const handleDetailClick = (record: HistoryRecord) => {
    setSelectedRecord(record)
    setDetailOpen(true)
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

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Point Customer History</h1>
            <p className="text-slate-600 mt-2">Memuat data...</p>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Point Customer History</h1>
          <p className="text-slate-600 mt-2">
            Riwayat poin untuk customer:{" "}
            <span className="font-semibold">
              {customerName || customerId}
            </span>
          </p>
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* API Error */}
      {apiError && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Table Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-slate-900">Riwayat Poin</CardTitle>
          </div>
          <CardDescription>
            {totalItems > 0
              ? `Menampilkan ${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, totalItems)} dari ${totalItems} data`
              : "Belum ada data riwayat"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Poin</TableHead>
                  <TableHead className="text-right">Saldo Poin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tanggal</TableHead>
                  <TableHead className="w-32">Description</TableHead>
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
                ) : histories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Tidak ada riwayat poin untuk customer ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  histories.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-slate-500">
                        {(currentPage - 1) * perPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="text-sm font-medium">{getTypeLabel(item.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={item.type === "earn" ? "text-emerald-600" : "text-amber-600"}>
                          {item.type === "earn" ? "+" : "-"}
                          {new Intl.NumberFormat("id-ID").format(item.point_amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-slate-900">
                          {new Intl.NumberFormat("id-ID").format(item.point_balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600 whitespace-nowrap">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700 max-w-xs whitespace-pre-wrap break-words">
                        {item.description || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetailClick(item)}
                          disabled={isSearching}
                        >
                          Detail
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
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, idx) =>
                    typeof page === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                        ...
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
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Detail Riwayat Poin
            </DialogTitle>
            <DialogDescription>Keterangan lengkap dari catatan riwayat poin ini.</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">ID</dt>
                  <dd className="text-sm font-medium text-slate-900">{selectedRecord.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Customer ID</dt>
                  <dd className="text-sm font-medium text-slate-900">{selectedRecord.customer_id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Tipe</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(selectedRecord.type)}
                      {getTypeLabel(selectedRecord.type)}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="text-sm font-medium">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedRecord.status)}`}
                    >
                      {selectedRecord.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Jumlah Poin</dt>
                  <dd
                    className={`text-sm font-bold ${selectedRecord.type === "earn" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {selectedRecord.type === "earn" ? "+" : "-"}
                    {new Intl.NumberFormat("id-ID").format(selectedRecord.point_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Saldo Poin</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {new Intl.NumberFormat("id-ID").format(selectedRecord.point_balance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Tanggal</dt>
                  <dd className="text-sm text-slate-900">{formatDate(selectedRecord.date)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Point Rule ID</dt>
                  <dd className="text-sm font-mono text-slate-900 truncate">{selectedRecord.point_id}</dd>
                </div>
              </div>

              {selectedRecord.description && (
                <div>
                  <dt className="text-sm text-slate-500">Deskripsi</dt>
                  <dd className="text-sm text-slate-900 mt-1">{selectedRecord.description}</dd>
                </div>
              )}

              {selectedRecord.type === "earn" && selectedRecord.transaction_amount != null && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <dt className="text-sm font-medium text-emerald-700">Nominal Transaksi</dt>
                  <dd className="text-lg font-bold text-emerald-700 mt-1">
                    {formatCurrency(selectedRecord.transaction_amount)}
                  </dd>
                  <p className="text-xs text-emerald-600 mt-1">
                    Total transaksi yang menghasilkan point ini
                  </p>
                </div>
              )}

              {selectedRecord.point && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <dt className="text-sm font-medium text-slate-700">Info Point Rule</dt>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500">Nama Rule</span>
                      <p className="text-sm font-medium text-slate-900">{selectedRecord.point.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Range Point</span>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(selectedRecord.point.range_point)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Reward Point</span>
                      <p className="text-sm font-medium text-slate-900">{selectedRecord.point.point} poin</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
