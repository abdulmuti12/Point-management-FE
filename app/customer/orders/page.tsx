"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  Star,
} from "lucide-react"

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "success"

type OrderItem = {
  product_id: number
  product_name: string
  variant_name: string | null
  quantity: number
  price: number
  image: string | null
}

type Order = {
  id: number
  order_number: string
  date: string
  status: OrderStatus
  total: number
  total_items: number
  point_earned?: number
  point_qualifies?: boolean
  items: OrderItem[]
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-400/10 text-yellow-600 border-yellow-400/30",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-400/10 text-blue-600 border-blue-400/30",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-400/10 text-purple-600 border-purple-400/30",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-400/10 text-green-600 border-green-400/30",
    icon: CheckCircle,
  },
  success: {
    label: "Delivered",
    color: "bg-green-400/10 text-green-600 border-green-400/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-400/10 text-red-600 border-red-400/30",
    icon: XCircle,
  },
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr))
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("customer_token")

    if (!token) {
      router.push("/customer/login")
      return
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE}/customers/get-orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        })

        if (response.status === 401) {
          localStorage.removeItem("customer_token")
          localStorage.removeItem("customer_name")
          router.push("/customer/login")
          return
        }

        if (!response.ok) {
          setError(`Gagal memuat pesanan (${response.status})`)
          setIsLoading(false)
          return
        }

        const json = await response.json()
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data)
        } else {
          setOrders([])
        }
      } catch (e) {
        setError("Terjadi kesalahan jaringan. Silakan coba lagi.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [router])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pesanan Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Riwayat pesanan Anda.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-white/50 border border-black/[0.08] backdrop-blur-sm">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Memuat pesanan...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-white/50 border border-black/[0.08] p-8 text-center backdrop-blur-sm">
          <XCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl bg-white/50 border border-black/[0.08] p-8 text-center backdrop-blur-sm">
          <Package className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 text-sm">Belum ada pesanan.</p>
          <p className="text-slate-400 text-xs mt-1">
            Pesanan Anda akan tampil di sini setelah melakukan pembelian.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.pending
            const StatusIcon = status.icon
            const isExpanded = expandedId === order.id
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
            const computedTotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0)

            return (
              <div
                key={order.id}
                className="rounded-xl bg-white/50 border border-black/[0.08] backdrop-blur-sm overflow-hidden"
              >
                <div
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.03] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{order.order_number}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${status.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(order.date)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    {order.point_earned != null && order.point_earned > 0 && (
                      <p className="text-sm text-amber-500 flex items-center justify-end gap-1 mb-0.5">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {order.point_earned.toLocaleString("id-ID")} poin
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-900">{formatRupiah(computedTotal)}</p>
                    <p className="text-xs text-slate-400">{totalItems} item</p>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {isExpanded && (
                  <div className="border-t border-black/[0.06] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">
                        {totalItems} item
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={item.product_id ?? idx}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-black/[0.04]"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {item.product_name}
                            </p>
                            {item.variant_name && (
                              <p className="text-xs text-slate-400">{item.variant_name}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {item.quantity} x {formatRupiah(item.price)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-slate-900">
                              {formatRupiah(item.quantity * item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-3 border-t border-black/[0.06] gap-8">
                      {order.point_earned != null && order.point_earned > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Poin Diperoleh
                          </p>
                          <p className="text-xl font-semibold text-amber-500">
                            +{order.point_earned.toLocaleString("id-ID")}{" "}
                            <span className="text-xs text-slate-400">poin</span>
                          </p>
                          {order.point_qualifies === false && (
                            <p className="text-[10px] text-slate-400 mt-1">Eligibility belum terpenuhi</p>
                          )}
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-sm font-semibold text-slate-900">{formatRupiah(computedTotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
