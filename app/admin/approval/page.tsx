"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Gift,
  Coins,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  Check,
  X as XIcon,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react"

type ClaimStatus = "waiting" | "approved" | "rejected" | "completed"

interface GiftClaim {
  id: string
  customer_id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  gift_id: string
  gift_name: string | null
  gift_image: string | null
  required_point: number
  status: ClaimStatus
  notes: string | null
  admin_note: string | null
  approved_by: string | null
  approver_name: string | null
  approved_at: string | null
  completed_at: string | null
  created_at: string | null
}

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
  from: number
  to: number
}

interface ToastNotification {
  id: string
  type: "success" | "error" | "info"
  title: string
  message: string
}

const STATUS_STYLES: Record<ClaimStatus, { label: string; className: string; icon: typeof Clock }> = {
  waiting:   { label: "Menunggu",    className: "bg-blue-100 text-blue-700 border-blue-200",    icon: Clock },
  approved:  { label: "Disetujui",   className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected:  { label: "Ditolak",     className: "bg-red-100 text-red-700 border-red-200",       icon: XCircle },
  completed: { label: "Selesai",     className: "bg-amber-100 text-amber-700 border-amber-200", icon: Truck },
}

const STATUS_TABS: Array<{ key: "all" | ClaimStatus; label: string }> = [
  { key: "waiting", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "completed", label: "Selesai" },
  { key: "rejected", label: "Ditolak" },
  { key: "all", label: "Semua" },
]

export default function GiftApprovalPage() {
  const [claims, setClaims] = useState<GiftClaim[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, total: 0, per_page: 10, from: 0, to: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ClaimStatus>("waiting")
  const [currentPage, setCurrentPage] = useState(1)

  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const addToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean
    claim: GiftClaim | null
    action: "approve" | "reject" | "complete" | null
  }>({ open: false, claim: null, action: null })
  const [adminNote, setAdminNote] = useState("")
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [detailClaim, setDetailClaim] = useState<GiftClaim | null>(null)

  const fetchClaims = useCallback(async (page = 1, status: "all" | ClaimStatus = statusFilter, search = searchValue) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      addToast("error", "Auth", "Token tidak ditemukan, silakan login ulang.")
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append("page", String(page))
      if (status !== "all") params.append("status", status)
      if (search.trim()) params.append("search", search.trim())

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admins/gift-claims?${params.toString()}`
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (res.status === 401) {
        localStorage.removeItem("token")
        addToast("error", "Auth", "Sesi berakhir, silakan login ulang.")
        return
      }
      const data = await res.json()
      if (!res.ok || data.success === false) {
        addToast("error", "Gagal memuat", data?.message || `HTTP ${res.status}`)
        setClaims([])
        return
      }
      // Backend returns: data.data.data[0] = { customer:{...}, gift:{...}, approver:{...}, ... }
      const outerPayload = data.data?.data?.data ?? data.data?.data ?? []
      const records: GiftClaim[] = Array.isArray(outerPayload)
        ? outerPayload.map((raw: any) => {
            const customer = raw?.customer ?? {}
            const gift = raw?.gift ?? {}
            const approver = raw?.approver ?? {}
            return {
              id: raw?.id ?? "",
              customer_id: raw?.customer_id ?? "",
              customer_name: customer?.name ?? customer?.full_name ?? null,
              customer_email: customer?.email ?? null,
              customer_phone: customer?.phone_number ?? null,
              gift_id: raw?.gift_id ?? "",
              gift_name: gift?.name ?? null,
              gift_image: gift?.image ?? null,
              required_point: raw?.required_point ?? 0,
              status: (raw?.status as ClaimStatus) ?? "waiting",
              notes: raw?.notes ?? null,
              admin_note: raw?.admin_note ?? null,
              approved_by: String(raw?.approved_by ?? ""),
              approver_name: approver?.name ?? null,
              approved_at: raw?.approved_at ?? null,
              completed_at: raw?.completed_at ?? null,
              created_at: raw?.created_at ?? null,
            }
          })
        : []

      const metaPayload = data.data?.data ?? data.data ?? {}
      const m: PaginationMeta = metaPayload.meta ?? {
        current_page: page,
        last_page: 1,
        total: records.length,
        per_page: records.length,
        from: records.length ? 1 : 0,
        to: records.length,
      }
      setClaims(records)
      setMeta(m)
      setCurrentPage(m.current_page ?? page)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error"
      addToast("error", "Network", msg)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchValue])

  useEffect(() => {
    fetchClaims(1, statusFilter, searchValue)
  }, [statusFilter, fetchClaims])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchClaims(1, statusFilter, searchValue)
  }

  const handleRefresh = () => {
    fetchClaims(currentPage, statusFilter, searchValue)
  }

  const openActionModal = (claim: GiftClaim, action: "approve" | "reject" | "complete") => {
    setActionModal({ open: true, claim, action })
    setAdminNote("")
    setActionError(null)
  }

  const closeActionModal = () => {
    if (isSubmittingAction) return
    setActionModal({ open: false, claim: null, action: null })
    setAdminNote("")
    setActionError(null)
  }

  const submitAction = async () => {
    const { claim, action } = actionModal
    if (!claim || !action) return
    const token = localStorage.getItem("token")
    if (!token) {
      addToast("error", "Auth", "Token tidak ditemukan.")
      return
    }
    setIsSubmittingAction(true)
    setActionError(null)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admins/gift-claims/${claim.id}/${action}`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ admin_note: adminNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors as Record<string, string[]>).flat().join(" ") : "") ||
          `HTTP ${res.status}`
        throw new Error(msg)
      }
      const actionLabel =
        action === "approve" ? "disetujui" : action === "reject" ? "ditolak" : "diselesaikan"
      addToast("success", "Berhasil", `Klaim "${claim.gift_name}" berhasil ${actionLabel}.`)
      closeActionModal()
      await fetchClaims(currentPage, statusFilter, searchValue)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const counts = {
    waiting: claims.filter((c) => c.status === "waiting").length,
    approved: claims.filter((c) => c.status === "approved").length,
    completed: claims.filter((c) => c.status === "completed").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toaster */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg p-3 shadow-lg border text-sm bg-white ${
              t.type === "success"
                ? "border-green-200 text-green-700"
                : t.type === "error"
                ? "border-red-200 text-red-700"
                : "border-blue-200 text-blue-700"
            }`}
          >
            <p className="font-medium">{t.title}</p>
            <p className="text-xs opacity-80 mt-0.5">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Approval Klaim Hadiah
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review dan approve/reject klaim hadiah dari customer.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Menunggu" value={counts.waiting} color="blue" />
        <StatCard icon={CheckCircle2} label="Disetujui" value={counts.approved} color="green" />
        <StatCard icon={Truck} label="Selesai" value={counts.completed} color="amber" />
        <StatCard icon={XCircle} label="Ditolak" value={counts.rejected} color="red" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Daftar Klaim</CardTitle>
              <CardDescription>{meta.total} total klaim</CardDescription>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Cari customer / hadiah..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button type="submit" variant="outline">Cari</Button>
            </form>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 mt-4 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setStatusFilter(t.key)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === t.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Tidak ada klaim dengan filter ini.
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => {
                const info = STATUS_STYLES[c.status]
                const StatusIcon = info.icon
                return (
                  <div
                    key={c.id}
                    className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="w-full md:w-24 h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {c.gift_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getImageUrl(c.gift_image)} alt={c.gift_name ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{c.gift_name ?? "Hadiah"}</h3>
                          <Badge variant="outline" className={info.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {info.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {c.customer_name ?? "Customer"}
                            {c.customer_email && <span className="text-slate-400">({c.customer_email})</span>}
                          </span>
                          {c.customer_phone && (
                            <span className="text-slate-400">{c.customer_phone}</span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {c.created_at ? formatDate(c.created_at) : "-"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Coins className="w-3 h-3" />
                            {c.required_point.toLocaleString("id-ID")} poin
                          </span>
                        </div>

                        {c.notes && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            <span className="text-slate-700 font-medium">Catatan customer:</span> {c.notes}
                          </p>
                        )}
                        {c.admin_note && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            <span className="text-amber-700 font-medium">Catatan admin:</span> {c.admin_note}
                          </p>
                        )}
                        {c.approver_name && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            Diproses oleh {c.approver_name}
                            {c.approved_at && ` • ${formatDate(c.approved_at)}`}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2 shrink-0 md:w-36">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setDetailClaim(c)}
                        >
                          Detail
                        </Button>
                        {c.status === "waiting" && (
                          <>
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => openActionModal(c, "approve")}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => openActionModal(c, "reject")}
                            >
                              <XIcon className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <Button
                            size="sm"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => openActionModal(c, "complete")}
                          >
                            <Truck className="w-3.5 h-3.5 mr-1" />
                            Selesaikan
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Menampilkan {meta.from}–{meta.to} dari {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1 || isLoading}
                  onClick={() => fetchClaims(meta.current_page - 1, statusFilter, searchValue)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-slate-600 px-3">
                  Halaman {meta.current_page} / {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page || isLoading}
                  onClick={() => fetchClaims(meta.current_page + 1, statusFilter, searchValue)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action modal (approve / reject / complete) */}
      <Dialog open={actionModal.open} onOpenChange={(o) => !o && closeActionModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionModal.action === "approve" && "Approve Klaim"}
              {actionModal.action === "reject" && "Reject Klaim"}
              {actionModal.action === "complete" && "Selesaikan Klaim"}
            </DialogTitle>
            <DialogDescription>
              {actionModal.action === "approve" && "Poin customer akan terpotong dan status klaim menjadi Disetujui."}
              {actionModal.action === "reject" && "Klaim akan ditandai Ditolak. Customer dapat mengajukan ulang."}
              {actionModal.action === "complete" && "Tandai klaim sebagai Selesai (hadiah sudah diberikan ke customer)."}
            </DialogDescription>
          </DialogHeader>

          {actionModal.claim && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                  {(actionModal.claim.customer_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{actionModal.claim.customer_name ?? "Customer"}</p>
                  {actionModal.claim.customer_email && (
                    <p className="text-xs text-slate-500 truncate">{actionModal.claim.customer_email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                  {actionModal.claim.gift_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(actionModal.claim.gift_image)} alt={actionModal.claim.gift_name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Gift className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{actionModal.claim.gift_name}</p>
                  <p className="text-xs text-amber-600">{actionModal.claim.required_point.toLocaleString("id-ID")} poin</p>
                </div>
              </div>
              {actionModal.claim.notes && (
                <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
                  <span className="font-medium">Catatan customer:</span> {actionModal.claim.notes}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="admin-note" className="text-xs">Catatan Admin (opsional)</Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tambahkan catatan untuk customer..."
              className="mt-1"
              disabled={isSubmittingAction}
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{adminNote.length}/500</p>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {actionError}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeActionModal} disabled={isSubmittingAction}>
              Batal
            </Button>
            <Button
              onClick={submitAction}
              disabled={isSubmittingAction}
              className={
                actionModal.action === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : actionModal.action === "reject"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }
            >
              {isSubmittingAction ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {actionModal.action === "approve" && <><Check className="w-3.5 h-3.5 mr-1.5" />Approve</>}
                  {actionModal.action === "reject" && <><XIcon className="w-3.5 h-3.5 mr-1.5" />Reject</>}
                  {actionModal.action === "complete" && <><Truck className="w-3.5 h-3.5 mr-1.5" />Selesaikan</>}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!detailClaim} onOpenChange={(o) => !o && setDetailClaim(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Klaim</DialogTitle>
          </DialogHeader>
          {detailClaim && (
            <div className="space-y-3 text-sm">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {detailClaim.gift_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(detailClaim.gift_image)} alt={detailClaim.gift_name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Gift className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Customer info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-lg shrink-0">
                  {(detailClaim.customer_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{detailClaim.customer_name ?? "-"}</p>
                  {detailClaim.customer_email && (
                    <p className="text-xs text-slate-500 truncate">{detailClaim.customer_email}</p>
                  )}
                </div>
              </div>

              <DetailRow label="Hadiah" value={detailClaim.gift_name ?? "-"} />
              <DetailRow label="Customer" value={`${detailClaim.customer_name ?? "-"}${detailClaim.customer_email ? ` (${detailClaim.customer_email})` : ""}`} />
              <DetailRow label="Poin" value={`${detailClaim.required_point.toLocaleString("id-ID")} poin`} />
              <DetailRow label="Status" value={STATUS_STYLES[detailClaim.status].label} />
              <DetailRow label="Diajukan" value={detailClaim.created_at ? formatDate(detailClaim.created_at) : "-"} />
              {detailClaim.approved_at && <DetailRow label="Disetujui" value={formatDate(detailClaim.approved_at)} />}
              {detailClaim.completed_at && <DetailRow label="Selesai" value={formatDate(detailClaim.completed_at)} />}
              {detailClaim.approver_name && <DetailRow label="Diproses oleh" value={detailClaim.approver_name} />}
              {detailClaim.notes && <DetailRow label="Catatan Customer" value={detailClaim.notes} />}
              {detailClaim.admin_note && <DetailRow label="Catatan Admin" value={detailClaim.admin_note} />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: "blue" | "green" | "amber" | "red" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
  }
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="col-span-2 text-sm text-slate-900">{value}</p>
    </div>
  )
}

function getImageUrl(path: string | null): string {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "")
  return `${base}/storage/${path}`
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return iso
  }
}