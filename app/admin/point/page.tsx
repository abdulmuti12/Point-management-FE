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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Award,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Layers,
  FileText,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PointData {
  id: string
  name: string
  status: string
  point: number
  price_point: number
  range_point: number
  description: string | null
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
    data: {
      data: PointData[]
    }
    meta: {
      current_page: number
      from: number | null
      last_page: number
      links: PaginationLink[]
      path: string
      per_page: number
      to: number | null
      total: number
    }
    links: {
      first: string
      last: string
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

export default function PointPage() {
  const [points, setPoints] = useState<PointData[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<PointData | null>(null)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [apiError, setApiError] = useState("")
  const router = useRouter()

  // Add dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreatingPoint, setIsCreatingPoint] = useState(false)
  const [createMessage, setCreateMessage] = useState("")
  const [newPoint, setNewPoint] = useState({
    name: "",
    status: "Active",
    point: 0,
    price_point: 0,
    range_point: 0,
    description: "",
  })

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pointToDelete, setPointToDelete] = useState<PointData | null>(null)
  const [isDeletingPoint, setIsDeletingPoint] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")

  // Edit dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [pointToEdit, setPointToEdit] = useState<PointData | null>(null)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [isUpdatingPoint, setIsUpdatingPoint] = useState(false)
  const [editMessage, setEditMessage] = useState("")
  const [editPoint, setEditPoint] = useState({
    name: "",
    status: "Active",
    point: 0,
    price_point: 0,
    range_point: 0,
    description: "",
  })

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

  // Fetch points data from API
  const fetchPoints = async (page = 1, value = "") => {
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
        params.append("name", value.trim())
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/point${params.toString() ? `?${params.toString()}` : ""}`

      console.log("Fetching points from:", url)

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
        setPoints([])
        return
      }

      if (response.ok) {
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch points")
          setPoints([])
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(0)
          return
        }

        // Extract data: responseData.data.data.data is the array
        if (
          responseData.data &&
          responseData.data.data &&
          responseData.data.data.data &&
          Array.isArray(responseData.data.data.data)
        ) {
          const pointsList = responseData.data.data.data
          console.log("Raw points data:", pointsList)

          setPoints(pointsList)
          setCurrentPage(responseData.data.meta?.current_page || 1)
          setTotalPages(responseData.data.meta?.last_page || 1)
          setTotalItems(responseData.data.meta?.total || 0)
          console.log("Points loaded successfully:", pointsList.length, "points")
        } else {
          console.error("Unexpected API response structure:", responseData)
          setApiError(`Unexpected data format from server.`)
          setPoints([])
        }
      } else {
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setPoints([])
        console.error("API Error:", errorMessage)
      }
    } catch (error) {
      console.error("Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setPoints([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPoints()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchPoints(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    fetchPoints(page, searchValue)
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchPoints(1, "")
  }

  // Handle view detail
  const handleViewDetail = (point: PointData) => {
    setSelectedPoint(point)
    setIsDetailDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Statistics
  const stats = [
    {
      title: "Total Points",
      value: totalItems.toString(),
      description: "All registered points",
      icon: Award,
      color: "text-blue-600",
    },
    {
      title: "Active",
      value: points.filter((p) => p.status?.toLowerCase() === "active").length.toString(),
      description: "Currently active",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Total Value",
      value: formatCurrency(points.reduce((sum, p) => sum + (Number(p.price_point) || 0), 0)),
      description: "Sum of all price_points",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Total Range",
      value: points.reduce((sum, p) => sum + (Number(p.range_point) || 0), 0).toLocaleString("id-ID"),
      description: "Sum of all range_points",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

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

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase()
    if (s === "active") {
      return "bg-green-100 text-green-800"
    }
    if (s === "inactive") {
      return "bg-slate-100 text-slate-800"
    }
    return "bg-yellow-100 text-yellow-800"
  }

  // Add dialog handlers
  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setNewPoint({
        name: "",
        status: "Active",
        point: 0,
        price_point: 0,
        range_point: 0,
        description: "",
      })
      setCreateMessage("")
    }
  }

  // Create point function
  const createPoint = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setCreateMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsCreatingPoint(true)
      setCreateMessage("")

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/point`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPoint.name,
          status: newPoint.status,
          point: Number(newPoint.point),
          price_point: Number(newPoint.price_point),
          range_point: Number(newPoint.range_point),
          description: newPoint.description,
        }),
      })

      const data = await response.json()
      console.log("Create point response:", data)

      if (response.status === 401) {
        setCreateMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Point Created", `Point "${newPoint.name}" has been successfully created.`)
        setNewPoint({
          name: "",
          status: "Active",
          point: 0,
          price_point: 0,
          range_point: 0,
          description: "",
        })
        fetchPoints(currentPage, searchValue)
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 1500)
      } else {
        setCreateMessage(data.message || `Failed to create point (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Create point API error:", error)
      setCreateMessage("Network error occurred while creating point")
    } finally {
      setIsCreatingPoint(false)
    }
  }

  const handleAddPoint = () => {
    if (!newPoint.name.trim()) {
      setCreateMessage("Please enter a point name")
      return
    }
    createPoint()
  }

  // Delete handlers
  const handleDeletePoint = (point: PointData) => {
    setPointToDelete(point)
    setIsDeleteDialogOpen(true)
    setDeleteMessage("")
  }

  const deletePoint = async () => {
    if (!pointToDelete) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setDeleteMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsDeletingPoint(true)
      setDeleteMessage("")

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/point/${pointToDelete.id}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        setDeleteMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Point Deleted", `Point "${pointToDelete.name}" has been successfully deleted.`)
        fetchPoints(currentPage, searchValue)
        setTimeout(() => {
          setIsDeleteDialogOpen(false)
          setPointToDelete(null)
          setDeleteMessage("")
        }, 1500)
      } else {
        setDeleteMessage(data.message || `Failed to delete point (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Delete point API error:", error)
      setDeleteMessage("Network error occurred while deleting point")
    } finally {
      setIsDeletingPoint(false)
    }
  }

  const handleDeleteDialogClose = () => {
    if (!isDeletingPoint) {
      setIsDeleteDialogOpen(false)
      setPointToDelete(null)
      setDeleteMessage("")
    }
  }

  // Edit handlers
  const handleEditPoint = async (point: PointData) => {
    setPointToEdit(point)
    setIsEditDialogOpen(true)
    setEditMessage("")
    setIsLoadingEditData(true)

    // Reset form with empty defaults
    setEditPoint({
      name: "",
      status: "Active",
      point: 0,
      price_point: 0,
      range_point: 0,
      description: "",
    })

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/point-edit/${point.id}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        setEditMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        const pointData = data.data
        setEditPoint({
          name: pointData.name || "",
          status: pointData.status || "Active",
          point: Number(pointData.point) || 0,
          price_point: Number(pointData.price_point) || 0,
          range_point: Number(pointData.range_point) || 0,
          description: pointData.description || "",
        })
        console.log("Edit data loaded:", pointData)
      } else {
        setEditMessage(data.message || `Failed to load point data (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Load point data API error:", error)
      setEditMessage("Network error occurred while loading point data")
    } finally {
      setIsLoadingEditData(false)
    }
  }

  const handleEditDialogClose = () => {
    if (!isUpdatingPoint && !isLoadingEditData) {
      setIsEditDialogOpen(false)
      setPointToEdit(null)
      setEditMessage("")
      setEditPoint({
        name: "",
        status: "Active",
        point: 0,
        price_point: 0,
        range_point: 0,
        description: "",
      })
    }
  }

  const updatePoint = async () => {
    if (!pointToEdit) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsUpdatingPoint(true)
      setEditMessage("")

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/point/${pointToEdit.id}`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editPoint.name.trim(),
          status: editPoint.status,
          point: Number(editPoint.point),
          price_point: Number(editPoint.price_point),
          range_point: Number(editPoint.range_point),
          description: editPoint.description,
        }),
      })

      console.log("Update response status:", response.status)

      let data: any
      try {
        data = await response.json()
        console.log("Update response data:", data)
      } catch (parseError) {
        console.error("Failed to parse update response:", parseError)
        setEditMessage("Failed to parse server response")
        return
      }

      if (response.status === 401) {
        setEditMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Point Updated", `Point "${editPoint.name}" has been successfully updated.`)
        fetchPoints(currentPage, searchValue)
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setPointToEdit(null)
          setEditMessage("")
        }, 1500)
      } else {
        setEditMessage(data?.message || `Failed to update point (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Update point API error:", error)
      setEditMessage("Network error occurred while updating point")
    } finally {
      setIsUpdatingPoint(false)
    }
  }

  const handleUpdatePoint = () => {
    if (!editPoint.name.trim()) {
      setEditMessage("Please enter a point name")
      return
    }
    updatePoint()
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
            <h1 className="text-3xl font-bold text-slate-900">Point Management</h1>
            <p className="text-slate-600 mt-2">Loading point data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Point Management</h1>
          <p className="text-slate-600 mt-2">Manage point tiers and pricing</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Point
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Point</DialogTitle>
              <DialogDescription>Create a new point tier</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {createMessage && (
                <Alert
                  className={
                    createMessage.includes("berhasil") || createMessage.toLowerCase().includes("success")
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription
                    className={
                      createMessage.includes("berhasil") || createMessage.toLowerCase().includes("success")
                        ? "text-green-800"
                        : "text-red-800"
                    }
                  >
                    {createMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPoint.name}
                  onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                  placeholder="Enter point name"
                  disabled={isCreatingPoint}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newPoint.status}
                  onValueChange={(value) => setNewPoint({ ...newPoint, status: value })}
                  disabled={isCreatingPoint}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="point">Point</Label>
                  <Input
                    id="point"
                    type="number"
                    value={newPoint.point}
                    onChange={(e) => setNewPoint({ ...newPoint, point: Number(e.target.value) })}
                    placeholder="0"
                    disabled={isCreatingPoint}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price_point">Price (IDR)</Label>
                  <Input
                    id="price_point"
                    type="number"
                    value={newPoint.price_point}
                    onChange={(e) => setNewPoint({ ...newPoint, price_point: Number(e.target.value) })}
                    placeholder="0"
                    disabled={isCreatingPoint}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="range_point">Range</Label>
                  <Input
                    id="range_point"
                    type="number"
                    value={newPoint.range_point}
                    onChange={(e) => setNewPoint({ ...newPoint, range_point: Number(e.target.value) })}
                    placeholder="0"
                    disabled={isCreatingPoint}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPoint.description}
                  onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  disabled={isCreatingPoint}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingPoint}>
                Cancel
              </Button>
              <Button onClick={handleAddPoint} disabled={isCreatingPoint}>
                {isCreatingPoint ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Point"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <div className="font-medium">Error loading points:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchPoints(currentPage, searchValue)
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
              <CardTitle className="text-slate-900">Points</CardTitle>
              <CardDescription>
                Showing {points.length} of {totalItems} points
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search points by name..."
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
              Searching for point name "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Point</TableHead>
                <TableHead className="text-right">Price Point</TableHead>
                <TableHead className="text-right">Range Point</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.length > 0 ? (
                points.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{point.name}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {point.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(point.status)}`}
                      >
                        {point.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-900 font-medium">
                      {point.point?.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right text-slate-900">
                      {formatCurrency(point.price_point)}
                    </TableCell>
                    <TableCell className="text-right text-slate-900">
                      {point.range_point?.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-xs">
                      <p className="truncate">{point.description || "-"}</p>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {point.created_at ? formatDate(point.created_at) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(point)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-800"
                          onClick={() => handleEditPoint(point)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeletePoint(point)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    {searchValue
                      ? `No points found with name matching "${searchValue}".`
                      : "No point data available."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems}{" "}
                results
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
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Point Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected point</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedPoint && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedPoint.name}</h3>
                    <p className="text-sm text-slate-600 mt-1 font-mono">ID: {selectedPoint.id}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(selectedPoint.status)}`}
                  >
                    {selectedPoint.status}
                  </span>
                </div>

                {/* Numbers */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                    <Layers className="w-4 h-4" />
                    <span>Point Numbers</span>
                  </h4>
                  <div className="grid gap-3 md:grid-cols-3 p-4 border border-slate-200 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-500">Point</p>
                      <p className="text-slate-900 font-medium text-lg">
                        {selectedPoint.point?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Price Point</p>
                      <p className="text-slate-900 font-medium text-lg">
                        {formatCurrency(selectedPoint.price_point)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Range Point</p>
                      <p className="text-slate-900 font-medium text-lg">
                        {selectedPoint.range_point?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPoint.description && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Description</span>
                    </h4>
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-slate-900 whitespace-pre-wrap">{selectedPoint.description}</p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Point Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">ID:</span>
                      <span className="text-blue-900 font-mono font-medium">{selectedPoint.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Name:</span>
                      <span className="text-blue-900 font-medium">{selectedPoint.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Status:</span>
                      <span className="text-blue-900 font-medium">{selectedPoint.status}</span>
                    </div>
                    {selectedPoint.created_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Created At:</span>
                        <span className="text-blue-900 font-medium">
                          {formatDateTime(selectedPoint.created_at)}
                        </span>
                      </div>
                    )}
                    {selectedPoint.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Updated At:</span>
                        <span className="text-blue-900 font-medium">
                          {formatDateTime(selectedPoint.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>Delete Point</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the point.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {deleteMessage && (
              <Alert
                className={
                  deleteMessage.toLowerCase().includes("berhasil") ||
                  deleteMessage.toLowerCase().includes("success")
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                <AlertDescription
                  className={
                    deleteMessage.toLowerCase().includes("berhasil") ||
                    deleteMessage.toLowerCase().includes("success")
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {deleteMessage}
                </AlertDescription>
              </Alert>
            )}

            {pointToDelete && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                    <Award className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{pointToDelete.name}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {pointToDelete.id}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Point: {pointToDelete.point?.toLocaleString("id-ID")} • Price:{" "}
                      {formatCurrency(pointToDelete.price_point)}
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Are you sure you want to delete this point?</p>
                      <p className="mt-1">
                        Point "{pointToDelete.name}" will be permanently removed from the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteDialogClose} disabled={isDeletingPoint}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deletePoint}
              disabled={isDeletingPoint}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingPoint ? "Deleting..." : "Delete Point"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Point</DialogTitle>
            <DialogDescription>Update point information</DialogDescription>
          </DialogHeader>

          {isLoadingEditData ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Loading point data...</span>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {editMessage && (
                <Alert
                  className={
                    editMessage.toLowerCase().includes("berhasil") ||
                    editMessage.toLowerCase().includes("success")
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription
                    className={
                      editMessage.toLowerCase().includes("berhasil") ||
                      editMessage.toLowerCase().includes("success")
                        ? "text-green-800"
                        : "text-red-800"
                    }
                  >
                    {editMessage}
                  </AlertDescription>
                </Alert>
              )}

              {pointToEdit && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                  Editing point ID: <span className="font-mono">{pointToEdit.id}</span>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editPoint.name}
                  onChange={(e) => setEditPoint({ ...editPoint, name: e.target.value })}
                  placeholder="Enter point name"
                  disabled={isUpdatingPoint}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editPoint.status}
                  onValueChange={(value) => setEditPoint({ ...editPoint, status: value })}
                  disabled={isUpdatingPoint}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-point">Point</Label>
                  <Input
                    id="edit-point"
                    type="number"
                    value={editPoint.point}
                    onChange={(e) => setEditPoint({ ...editPoint, point: Number(e.target.value) })}
                    placeholder="0"
                    disabled={isUpdatingPoint}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price_point">Price (IDR)</Label>
                  <Input
                    id="edit-price_point"
                    type="number"
                    value={editPoint.price_point}
                    onChange={(e) => setEditPoint({ ...editPoint, price_point: Number(e.target.value) })}
                    placeholder="0"
                    disabled={isUpdatingPoint}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-range_point">Range</Label>
                  <Input
                    id="edit-range_point"
                    type="number"
                    value={editPoint.range_point}
                    onChange={(e) => setEditPoint({ ...editPoint, range_point: Number(e.target.value) })}
                    placeholder="0"
                    disabled={isUpdatingPoint}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editPoint.description}
                  onChange={(e) => setEditPoint({ ...editPoint, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  disabled={isUpdatingPoint}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleEditDialogClose}
              disabled={isUpdatingPoint || isLoadingEditData}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePoint} disabled={isUpdatingPoint || isLoadingEditData}>
              {isUpdatingPoint ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Point"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
