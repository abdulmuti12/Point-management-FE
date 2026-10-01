"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  X,
  ShoppingBag,
  User,
  Package,
  Truck,
  Clock,
  CheckCheck,
  Ban,
  MapPin,
  Phone,
  Map,
  CreditCard,
  FileText,
  Loader2,
  Plus,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrderCustomer {
  id: number
  name: string
  full_name: string
  email: string
  phone_number: string
  avatar?: string | null
}

interface OrderItem {
  product_name: string
  variant_name: string
  image: string
}

interface OrderItemFull {
  id: number
  product_id: number
  product_name: string
  name?: string
  variant_name: string
  quantity: number
  price: number
  subtotal: number
  image: string
  category?: { id: number; name: string } | null
  brand?: { id: number; name: string } | null
}

interface ShippingInfo {
  recipient_name: string
  phone: string
  shipping_address: string
  province_id: string | null
  province_name: string | null
  city_id: string | null
  city_name: string | null
  district_id: string | null
  district_name: string | null
  subdistrict_id: string | null
  subdistrict_name: string | null
  postal_code: string | null
}

interface OrderTotals {
  subtotal: number
  shipping_cost: number
  grand_total: number
  total_items: number
  item_count: number
}

interface OrderTransaction {
  id?: number
  payment_method?: string
  payment_status?: string
  paid_at?: string | null
  amount?: number
  reference?: string | null
}

interface OrderDetail {
  id: number
  order_number: string
  date: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  notes: string | null
  customer: OrderCustomer
  shipping: ShippingInfo
  items: OrderItemFull[]
  totals: OrderTotals
  transaction: OrderTransaction | null
}

interface Order {
  id: number
  order_number: string
  date: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  customer: OrderCustomer
  subtotal: number
  shipping_cost: number
  grand_total: number
  total_items: number
  item_count: number
  first_item: OrderItem
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
    data: Order[]
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
      first_page_url: string
      last_page_url: string
      prev_page_url: string | null
      next_page_url: string | null
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

// --- Manual Order Input Types ---
interface CustomerOption {
  id: string
  name: string
  full_name: string
  email: string
  phone_number: string
  status: string
}

interface CategoryOption {
  id: number
  name: string
}

interface BrandOption {
  id: number
  name: string
}

interface ManualOrderItem {
  temp_id: string
  name: string
  quantity: string
  price: string
  category_id: string
  brand_id: string
}

interface ManualOrderForm {
  customer_id: string | ""
  grand_total: string
  subtotal: string
  shipping_cost: string
  status: string
  notes: string
  recipient_name: string
  phone: string
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "processing", label: "Processing", color: "bg-blue-100 text-blue-800", icon: Package },
  { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCheck },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: Ban },
]

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [apiError, setApiError] = useState("")
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false)
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [manualOrderItems, setManualOrderItems] = useState<ManualOrderItem[]>([])
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderFormError, setOrderFormError] = useState("")
  const [manualOrderForm, setManualOrderForm] = useState<ManualOrderForm>({
    customer_id: "",
    grand_total: "",
    subtotal: "",
    shipping_cost: "",
    status: "processing",
    notes: "",
    recipient_name: "",
    phone: "",
  })
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    note: "",
  })
  const [newCustomerError, setNewCustomerError] = useState("")
  const router = useRouter()

  // Toast notification functions
  const addToast = (type: "success" | "error", title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastNotification = { id, type, title, message }
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Fetch orders data from API
  const fetchOrders = async (page = 1, value = "") => {
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
      const url = `${apiBase}/admins/get-orders${params.toString() ? `?${params.toString()}` : ""}`

      console.log("Fetching orders from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)

      if (response.status === 401) {
        console.log("Unauthorized access, redirecting to login")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      let responseData: ApiResponse | any
      try {
        responseData = await response.json()
        console.log("API Response:", responseData)
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        setApiError(`Failed to parse server response. Status: ${response.status}`)
        setOrders([])
        return
      }

      if (response.ok) {
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch orders")
          setOrders([])
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(0)
          return
        }

        // Extract data: responseData.data.data is the array of orders
        if (responseData.data && Array.isArray(responseData.data.data)) {
          const ordersList = responseData.data.data
          console.log("Raw orders data:", ordersList)

          setOrders(ordersList)
          setCurrentPage(responseData.data.meta?.current_page || 1)
          setTotalPages(responseData.data.meta?.last_page || 1)
          setTotalItems(responseData.data.meta?.total || 0)
          setPerPage(responseData.data.meta?.per_page || 10)
          console.log("Orders loaded successfully:", ordersList.length, "orders")
        } else {
          console.error("Unexpected API response structure:", responseData)
          setApiError(`Unexpected data format from server. Expected array of orders.`)
          setOrders([])
        }
      } else {
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setOrders([])
        console.error("API Error:", errorMessage)
      }
    } catch (error) {
      console.error("Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setOrders([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchOrders(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    fetchOrders(page, searchValue)
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchOrders(1, "")
  }

  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order)
    setSelectedOrderDetail(null)
    setDetailError("")
    setIsDetailDialogOpen(true)
    setIsLoadingDetail(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setDetailError("No authentication token found. Please login.")
        setIsLoadingDetail(false)
        router.push("/login")
        return
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/get-orders/${order.id}`

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

      const data = await response.json()

      if (response.ok && data.success) {
        setSelectedOrderDetail(data.data)
      } else {
        setDetailError(data.message || `Failed to load order detail (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Fetch order detail error:", error)
      setDetailError("Network error occurred while loading order detail.")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleCloseDetail = (open: boolean) => {
    setIsDetailDialogOpen(open)
    if (!open) {
      setSelectedOrderDetail(null)
      setDetailError("")
    }
  }

  // --- Manual Order Input Handlers ---
  const handleOpenManualOrder = async () => {
    setIsManualOrderOpen(true)
    setOrderFormError("")
    setManualOrderForm({
      customer_id: "",
      grand_total: "",
      subtotal: "",
      shipping_cost: "",
      status: "processing",
      notes: "",
      recipient_name: "",
      phone: "",
    })
    setManualOrderItems([
      {
        temp_id: `tmp_${Date.now()}_1`,
        name: "",
        quantity: "1",
        price: "",
        category_id: "",
        brand_id: "",
      },
    ])
    await Promise.all([fetchCustomers(), fetchCategories(), fetchBrands()])
  }

  const handleCloseManualOrder = (open: boolean) => {
    setIsManualOrderOpen(open)
    if (!open) {
      setOrderFormError("")
      setManualOrderItems([])
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      setIsLoadingCustomers(true)
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/get-customers?per_page=100`

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

      const data = await response.json()
      if (response.ok && data.success) {
        const list: CustomerOption[] = data.data?.data || []
        setCustomers(list)
        if (list.length === 0) {
          setOrderFormError("Belum ada customer aktif. Tambahkan customer terlebih dahulu.")
        }
      } else {
        setOrderFormError(data.message || "Gagal memuat daftar customer.")
      }
    } catch (error) {
      console.error("Fetch customers error:", error)
      setOrderFormError("Network error saat memuat daftar customer.")
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const handleCustomerChange = (value: string) => {
    const selected = customers.find((c) => c.id === value)
    setManualOrderForm((prev) => ({
      ...prev,
      customer_id: value,
      recipient_name: selected?.full_name || "",
      phone: selected?.phone_number || "",
    }))
  }

  const resetNewCustomerForm = () => {
    setNewCustomerForm({ name: "", full_name: "", email: "", phone_number: "", address: "", note: "" })
    setNewCustomerError("")
  }

  const handleAddCustomer = async () => {
    setNewCustomerError("")
    if (!newCustomerForm.name.trim() || !newCustomerForm.full_name.trim() || !newCustomerForm.email.trim() || !newCustomerForm.phone_number.trim()) {
      setNewCustomerError("Nama, nama lengkap, email, dan nomor telepon wajib diisi.")
      return
    }
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      setIsAddingCustomer(true)
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const response = await fetch(`${apiBase}/admins/customer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomerForm),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const created = data.data?.customer
        addToast("success", "Customer ditambahkan", `Akun untuk ${created?.full_name} berhasil dibuat.`)
        await fetchCustomers()
        if (created?.id) {
          setManualOrderForm((prev) => ({
            ...prev,
            customer_id: created.id,
            recipient_name: created.full_name || "",
            phone: created.phone_number || "",
          }))
        }
        resetNewCustomerForm()
        setIsAddCustomerDialogOpen(false)
      } else {
        const errorMsg = data?.error || data?.message || "Gagal menambahkan customer."
        setNewCustomerError(errorMsg)
        if (response.status === 409 || response.status === 422) {
          addToast("error", "Gagal membuat customer", errorMsg)
        }
      }
    } catch (err) {
      console.error("Add customer error:", err)
      setNewCustomerError("Network error saat menambahkan customer.")
      addToast("error", "Network error", "Network error saat menambahkan customer.")
    } finally {
      setIsAddingCustomer(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      setIsLoadingLookups(true)
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const response = await fetch(`${apiBase}/admins/get-categories`, {
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
      const categoryData = await response.json()
      if (response.ok && categoryData.success) {
        const list: CategoryOption[] = Array.isArray(categoryData.data) ? categoryData.data : []
        setCategories(list)
      } else {
        console.warn("Fetch categories failed:", categoryData.message)
      }
    } catch (error) {
      console.error("Fetch categories error:", error)
    } finally {
      setIsLoadingLookups(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      setIsLoadingLookups(true)
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const response = await fetch(`${apiBase}/admins/get-brands`, {
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
      const brandData = await response.json()
      if (response.ok && brandData.success) {
        const list: BrandOption[] = Array.isArray(brandData.data) ? brandData.data : []
        setBrands(list)
      } else {
        console.warn("Fetch brands failed:", brandData.message)
      }
    } catch (error) {
      console.error("Fetch brands error:", error)
    } finally {
      setIsLoadingLookups(false)
    }
  }

  const addManualItem = () => {
    setManualOrderItems((prev) => [
      ...prev,
      {
        temp_id: `tmp_${Date.now()}_${prev.length + 1}`,
        name: "",
        quantity: "1",
        price: "",
        category_id: "",
        brand_id: "",
      },
    ])
  }

  const removeManualItem = (tempId: string) => {
    setManualOrderItems((prev) => (prev.length > 1 ? prev.filter((it) => it.temp_id !== tempId) : prev))
  }

  const updateManualItem = (tempId: string, field: keyof ManualOrderItem, value: string) => {
    setManualOrderItems((prev) =>
      prev.map((it) => (it.temp_id === tempId ? { ...it, [field]: value } : it)),
    )
  }

  const calcManualItemsSubtotal = (): number => {
    return manualOrderItems.reduce((sum, it) => {
      const qty = parseInt(it.quantity, 10) || 0
      const price = Number(it.price) || 0
      return sum + qty * price
    }, 0)
  }

  // Auto-sync subtotal and grand_total when items or shipping_cost change
  const itemsSubtotal = calcManualItemsSubtotal()
  const shippingCostValue = manualOrderForm.shipping_cost
  useEffect(() => {
    setManualOrderForm((prev) => {
      const newSubtotal = String(itemsSubtotal)
      const newGrandTotal = String(Number(prev.shipping_cost || 0) + itemsSubtotal)
      if (prev.subtotal !== newSubtotal || prev.grand_total !== newGrandTotal) {
        return { ...prev, subtotal: newSubtotal, grand_total: newGrandTotal }
      }
      return prev
    })
  }, [itemsSubtotal, shippingCostValue])

  const handleSubmitManualOrder = async () => {
    setOrderFormError("")

    if (!manualOrderForm.customer_id) {
      setOrderFormError("Customer wajib dipilih.")
      return
    }

    // Validate items
    if (manualOrderItems.length === 0) {
      setOrderFormError("Setidaknya satu item harus ditambahkan ke transaksi.")
      return
    }

    for (const item of manualOrderItems) {
      if (!item.name.trim()) {
        setOrderFormError("Nama item tidak boleh kosong.")
        return
      }
      const qty = parseInt(item.quantity, 10)
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        setOrderFormError(`Quantity item "${item.name}" harus angka > 0.`)
        return
      }
      const price = Number(item.price)
      if (isNaN(price) || price <= 0) {
        setOrderFormError(`Harga item "${item.name}" harus angka > 0.`)
        return
      }
    }

    const shippingCost = manualOrderForm.shipping_cost
      ? Number(manualOrderForm.shipping_cost)
      : 0

    const payload: Record<string, any> = {
      customer_id: manualOrderForm.customer_id,
      grand_total: Number(manualOrderForm.grand_total),
      subtotal: Number(manualOrderForm.subtotal),
      status: manualOrderForm.status,
      items: manualOrderItems.map((item, idx) => ({
        order_index: idx + 1,
        name: item.name.trim(),
        quantity: parseInt(item.quantity, 10),
        price: Number(item.price),
        category_id: item.category_id ? Number(item.category_id) : null,
        brand_id: item.brand_id ? Number(item.brand_id) : null,
      })),
    }
    if (manualOrderForm.shipping_cost) payload.shipping_cost = shippingCost
    if (manualOrderForm.notes.trim()) payload.notes = manualOrderForm.notes.trim()
    if (manualOrderForm.recipient_name.trim()) payload.recipient_name = manualOrderForm.recipient_name.trim()
    if (manualOrderForm.phone.trim()) payload.phone = manualOrderForm.phone.trim()

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      setIsSubmittingOrder(true)
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/order`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      const data = await response.json()

      if (response.ok && data.success) {
        addToast(
          "success",
          "Transaksi Berhasil",
          `Order ${data.data?.order_number || ""} berhasil ditambahkan`,
        )
        setIsManualOrderOpen(false)
        fetchOrders(currentPage, searchValue)

        // Opsional: trigger hitung point jika status delivered
        if (manualOrderForm.status === "delivered") {
          try {
            await fetch(`${apiBase}/admins/redeem-point/calculate/${manualOrderForm.customer_id}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            })
          } catch (e) {
            console.warn("Point calc trigger failed (non-blocking):", e)
          }
        }
      } else {
        const message =
          typeof data.message === "string"
            ? data.message
            : Object.values(data.message || {}).flat().join(", ") || "Gagal menyimpan transaksi."
        setOrderFormError(message)
        addToast("error", "Gagal", message)
      }
    } catch (error) {
      console.error("Submit manual order error:", error)
      const message = error instanceof Error ? error.message : "Network error."
      setOrderFormError(message)
      addToast("error", "Network Error", message)
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  // Statistics based on current data
  const stats = [
    {
      title: "Total Orders",
      value: totalItems.toString(),
      description: "All registered orders",
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      title: "Pending",
      value: orders.filter((o) => o.status === "pending").length.toString(),
      description: "Awaiting processing",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Delivered",
      value: orders.filter((o) => o.status === "delivered").length.toString(),
      description: "Successfully completed",
      icon: CheckCheck,
      color: "text-green-600",
    },
    {
      title: "Cancelled",
      value: orders.filter((o) => o.status === "cancelled").length.toString(),
      description: "Cancelled orders",
      icon: Ban,
      color: "text-red-600",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusInfo = (status: Order["status"]) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  }

  // Build pagination numbers with ellipsis
  const getPageNumbers = () => {
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
            <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
            <p className="text-slate-600 mt-2">Loading order data...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
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

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
              toast.type === "success" ? "border-l-4 border-green-500" : "border-l-4 border-red-500"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === "success" ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-600 mt-2">View and manage customer orders</p>
        </div>
        <Button
          onClick={handleOpenManualOrder}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Input Transaksi Manual
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
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

      {/* API Error Message */}
      {apiError && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <div className="font-medium">Error loading orders:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchOrders(currentPage, searchValue)
                }}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-900">Orders</CardTitle>
              <CardDescription>
                Showing {orders.length} of {totalItems} orders
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by order number, customer..."
                  value={searchValue}
                  onChange={(e) => handleSearchValueChange(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isSearching}
                />
                {isSearching && (
                  <div className="absolute right-8 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  </div>
                )}
                {searchValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-slate-100"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Search Info */}
          {searchValue && (
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              Searching for "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>First Item</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status)
                  const StatusIcon = statusInfo.icon
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{order.order_number}</p>
                            <p className="text-xs text-slate-500">ID: {order.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div>
                          <p className="font-medium text-slate-900">{order.customer.full_name}</p>
                          <p className="text-xs text-slate-500">{order.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {order.first_item?.image ? (
                              <img
                                src={order.first_item.image || "/placeholder.svg"}
                                alt={order.first_item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {order.first_item?.product_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {order.first_item?.variant_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="text-sm">
                          <p className="font-medium">{order.item_count} SKU</p>
                          <p className="text-xs text-slate-500">{order.total_items} qty</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900 font-medium">
                        {formatCurrency(order.grand_total)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">{formatDate(order.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(order)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    {searchValue ? `No orders found matching "${searchValue}".` : "No order data available."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalItems)} of{" "}
                {totalItems} results
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>Order Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected order</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-600">Loading order detail...</p>
              </div>
            ) : detailError ? (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium">Failed to load order detail</div>
                  <div className="text-sm mt-1">{detailError}</div>
                </AlertDescription>
              </Alert>
            ) : selectedOrderDetail ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedOrderDetail.order_number}</h3>
                    <p className="text-sm text-slate-600 mt-1">Placed on {formatDateTime(selectedOrderDetail.date)}</p>
                  </div>
                  {(() => {
                    const statusInfo = getStatusInfo(selectedOrderDetail.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <span
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusInfo.label}</span>
                      </span>
                    )
                  })()}
                </div>

                {/* Notes */}
                {selectedOrderDetail.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Notes</span>
                    </h4>
                    <div className="p-4 border border-slate-200 rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="text-sm text-slate-800">{selectedOrderDetail.notes}</p>
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Customer Information</span>
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 p-4 border border-slate-200 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="text-slate-900 font-medium">{selectedOrderDetail.customer.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Username</p>
                      <p className="text-slate-900">{selectedOrderDetail.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-slate-900 break-all">{selectedOrderDetail.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-slate-900">{selectedOrderDetail.customer.phone_number}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                    <Truck className="w-4 h-4" />
                    <span>Shipping Information</span>
                  </h4>
                  <div className="p-4 border border-slate-200 rounded-lg space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Recipient</p>
                          <p className="text-slate-900 font-medium">{selectedOrderDetail.shipping.recipient_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="text-slate-900 font-medium">{selectedOrderDetail.shipping.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 pt-2 border-t border-slate-100">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="text-slate-900">{selectedOrderDetail.shipping.shipping_address}</p>
                        {(selectedOrderDetail.shipping.subdistrict_name ||
                          selectedOrderDetail.shipping.district_name ||
                          selectedOrderDetail.shipping.city_name ||
                          selectedOrderDetail.shipping.province_name ||
                          selectedOrderDetail.shipping.postal_code) && (
                          <p className="text-sm text-slate-600 mt-1">
                            {[
                              selectedOrderDetail.shipping.subdistrict_name,
                              selectedOrderDetail.shipping.district_name,
                              selectedOrderDetail.shipping.city_name,
                              selectedOrderDetail.shipping.province_name,
                              selectedOrderDetail.shipping.postal_code,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {(!selectedOrderDetail.shipping.province_name &&
                          !selectedOrderDetail.shipping.city_name &&
                          !selectedOrderDetail.shipping.district_name &&
                          !selectedOrderDetail.shipping.subdistrict_name &&
                          !selectedOrderDetail.shipping.postal_code) && (
                          <p className="text-xs text-slate-400 mt-1 italic">Region details not available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>Order Items ({selectedOrderDetail.items.length})</span>
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-[50%]">Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="hidden md:table-cell">Category</TableHead>
                          <TableHead className="hidden md:table-cell">Brand</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrderDetail.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                                  {item.image ? (
                                    <img
                                      src={item.image || "/placeholder.svg"}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = "none"
                                      }}
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                                  {item.variant_name && <p className="text-xs text-slate-500">{item.variant_name}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-slate-900 font-medium">{item.quantity}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-600">
                              {item.category?.name || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-600">
                              {item.brand?.name || "-"}
                            </TableCell>
                            <TableCell className="text-right text-slate-900">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right text-slate-900 font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Order Summary / Totals */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Order Summary</h4>
                  <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal ({selectedOrderDetail.totals.item_count} SKU)</span>
                      <span className="text-slate-900">{formatCurrency(selectedOrderDetail.totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Shipping Cost</span>
                      <span className="text-slate-900">{formatCurrency(selectedOrderDetail.totals.shipping_cost)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between">
                      <span className="font-medium text-slate-900">Grand Total</span>
                      <span className="font-bold text-slate-900 text-lg">
                        {formatCurrency(selectedOrderDetail.totals.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Transaction</span>
                  </h4>
                  {selectedOrderDetail.transaction ? (
                    <div className="p-4 border border-slate-200 rounded-lg grid gap-3 md:grid-cols-2 text-sm">
                      {selectedOrderDetail.transaction.id !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500">Transaction ID</p>
                          <p className="text-slate-900 font-medium">#{selectedOrderDetail.transaction.id}</p>
                        </div>
                      )}
                      {selectedOrderDetail.transaction.payment_method && (
                        <div>
                          <p className="text-xs text-slate-500">Payment Method</p>
                          <p className="text-slate-900 font-medium capitalize">
                            {selectedOrderDetail.transaction.payment_method}
                          </p>
                        </div>
                      )}
                      {selectedOrderDetail.transaction.payment_status && (
                        <div>
                          <p className="text-xs text-slate-500">Payment Status</p>
                          <p className="text-slate-900 font-medium capitalize">
                            {selectedOrderDetail.transaction.payment_status}
                          </p>
                        </div>
                      )}
                      {selectedOrderDetail.transaction.amount !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="text-slate-900 font-medium">
                            {formatCurrency(selectedOrderDetail.transaction.amount)}
                          </p>
                        </div>
                      )}
                      {selectedOrderDetail.transaction.reference && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-500">Reference</p>
                          <p className="text-slate-900 font-mono text-xs break-all">
                            {selectedOrderDetail.transaction.reference}
                          </p>
                        </div>
                      )}
                      {selectedOrderDetail.transaction.paid_at && (
                        <div>
                          <p className="text-xs text-slate-500">Paid At</p>
                          <p className="text-slate-900">{formatDateTime(selectedOrderDetail.transaction.paid_at)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center">
                      <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No transaction recorded yet</p>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Order Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Order ID:</span>
                      <span className="text-blue-900 font-medium">#{selectedOrderDetail.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Order Number:</span>
                      <span className="text-blue-900 font-medium">{selectedOrderDetail.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Customer ID:</span>
                      <span className="text-blue-900 font-medium">#{selectedOrderDetail.customer.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Items:</span>
                      <span className="text-blue-900 font-medium">
                        {selectedOrderDetail.totals.total_items} qty
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Unique SKUs:</span>
                      <span className="text-blue-900 font-medium">{selectedOrderDetail.totals.item_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Order Date:</span>
                      <span className="text-blue-900 font-medium">{formatDateTime(selectedOrderDetail.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDetail(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Order Input Dialog */}
      <Dialog open={isManualOrderOpen} onOpenChange={handleCloseManualOrder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-slate-900" />
              <span>Input Transaksi Manual</span>
            </DialogTitle>
            <DialogDescription>
              Buat order baru untuk customer yang melakukan transaksi di luar platform.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto space-y-5 pr-1">
            {orderFormError && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800 text-sm">
                  {orderFormError}
                </AlertDescription>
              </Alert>
            )}

            {/* Customer */}
            <div className="space-y-2">
              <Label htmlFor="customer_id">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Select
                value={manualOrderForm.customer_id ? String(manualOrderForm.customer_id) : ""}
                onValueChange={handleCustomerChange}
                disabled={isLoadingCustomers}
              >
                <SelectTrigger id="customer_id">
                  <SelectValue
                    placeholder={isLoadingCustomers ? "Memuat customer..." : "Pilih customer"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 && !isLoadingCustomers ? (
                    <SelectItem value="__empty__" disabled>
                      Belum ada customer aktif
                    </SelectItem>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {c.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                onClick={() => setIsAddCustomerDialogOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" /> Tambah Customer Baru
              </Button>
            </div>

            {/* --- Items Section --- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Items / Produk</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addManualItem}
                  disabled={isSubmittingOrder}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Tambah Item
                </Button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {manualOrderItems.map((item, index) => (
                  <div
                    key={item.temp_id}
                    className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Item #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeManualItem(item.temp_id)}
                        disabled={manualOrderItems.length <= 1}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`item_name_${index}`} className="text-xs">
                        Nama Produk <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`item_name_${index}`}
                        placeholder="Masukkan nama produk"
                        value={item.name}
                        onChange={(e) => updateManualItem(item.temp_id, "name", e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`item_qty_${index}`} className="text-xs">
                          Qty <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`item_qty_${index}`}
                          type="number"
                          min={1}
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => updateManualItem(item.temp_id, "quantity", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item_price_${index}`} className="text-xs">
                          Harga <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`item_price_${index}`}
                          type="number"
                          min={0}
                          step="any"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) => updateManualItem(item.temp_id, "price", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`item_category_${index}`} className="text-xs">Kategori</Label>
                        <Select
                          value={item.category_id}
                          onValueChange={(v) => updateManualItem(item.temp_id, "category_id", v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item_brand_${index}`} className="text-xs">Merek</Label>
                        <Select
                          value={item.brand_id}
                          onValueChange={(v) => updateManualItem(item.temp_id, "brand_id", v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Pilih merek" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((br) => (
                              <SelectItem key={br.id} value={String(br.id)}>
                                {br.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Subtotal per item */}
                    <div className="flex justify-end">
                      <span className="text-xs font-medium text-slate-600">
                        Subtotal: {formatCurrency(item.quantity ? parseInt(item.quantity, 10) * Number(item.price) || 0 : 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto subtotal display */}
              <div className="flex justify-between text-sm font-medium border-t border-slate-200 pt-2">
                <span className="text-slate-600">Subtotal Otomatis:</span>
                <span className="text-slate-900">{formatCurrency(calcManualItemsSubtotal())}</span>
              </div>
            </div>

            {/* Nominal */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Grand Total</Label>
                <div className="flex items-center h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-900 font-semibold">
                  {formatCurrency(Number(manualOrderForm.grand_total) || 0)}
                </div>
                <p className="text-xs text-slate-500">
                  Subtotal items: {formatCurrency(itemsSubtotal)} + Ongkir
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_cost">Ongkir</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={manualOrderForm.shipping_cost}
                  onChange={(e) =>
                    setManualOrderForm((p) => ({ ...p, shipping_cost: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Recipient */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipient_name">Nama Penerima</Label>
                <Input
                  id="recipient_name"
                  placeholder="Otomatis dari customer"
                  value={manualOrderForm.recipient_name}
                  onChange={(e) =>
                    setManualOrderForm((p) => ({ ...p, recipient_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No HP</Label>
                <Input
                  id="phone"
                  placeholder="08xxx"
                  value={manualOrderForm.phone}
                  onChange={(e) =>
                    setManualOrderForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status Order</Label>
              <Select
                value={manualOrderForm.status}
                onValueChange={(v) => setManualOrderForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Jika status <b>Delivered</b>, sistem otomatis memicu kalkulasi point customer.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Admin</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Misal: Transaksi cash langsung di toko"
                value={manualOrderForm.notes}
                onChange={(e) =>
                  setManualOrderForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleCloseManualOrder(false)}
              disabled={isSubmittingOrder}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitManualOrder}
              disabled={isSubmittingOrder}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Simpan Transaksi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Customer Dialog */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={(open) => { setIsAddCustomerDialogOpen(open); if (!open) resetNewCustomerForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Customer Baru</DialogTitle>
            <DialogDescription>Buat akun customer baru untuk digunakan dalam transaksi ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {newCustomerError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{newCustomerError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nc_name">Nama *</Label>
                <Input
                  id="nc_name"
                  placeholder="Nama depan"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nc_full_name">Nama Lengkap *</Label>
                <Input
                  id="nc_full_name"
                  placeholder="Ahmad Sudirman"
                  value={newCustomerForm.full_name}
                  onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nc_email">Email *</Label>
                <Input
                  id="nc_email"
                  type="email"
                  placeholder="customer@email.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nc_phone">No. Telepon *</Label>
                <Input
                  id="nc_phone"
                  placeholder="081234567890"
                  value={newCustomerForm.phone_number}
                  onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc_address">Alamat</Label>
              <Textarea
                id="nc_address"
                placeholder="Jl. ..."
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc_note">Catatan</Label>
              <Input
                id="nc_note"
                placeholder="Opsional"
                value={newCustomerForm.note}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddCustomerDialogOpen(false); resetNewCustomerForm(); }}>
              Batal
            </Button>
            <Button onClick={handleAddCustomer} disabled={isAddingCustomer}>
              {isAddingCustomer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan & Buat Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
