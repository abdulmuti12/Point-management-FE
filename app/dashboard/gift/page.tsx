"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  ImageIcon,
  Coins,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface GiftData {
  id: string
  name: string
  total_point: number
  image: string | null
  description: string | null
  status: string
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
    data: GiftData[]
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

export default function GiftPage() {
  const [gifts, setGifts] = useState<GiftData[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedGift, setSelectedGift] = useState<GiftData | null>(null)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [apiError, setApiError] = useState("")
  const router = useRouter()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreatingGift, setIsCreatingGift] = useState(false)
  const [createMessage, setCreateMessage] = useState("")
  const [newGift, setNewGift] = useState({
    name: "",
    total_point: "",
    description: "",
    status: "active",
  })
  const [giftImage, setGiftImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [giftToDelete, setGiftToDelete] = useState<GiftData | null>(null)
  const [isDeletingGift, setIsDeletingGift] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [giftToEdit, setGiftToEdit] = useState<GiftData | null>(null)
  const [isEditingGift, setIsEditingGift] = useState(false)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [editMessage, setEditMessage] = useState("")
  const [editGift, setEditGift] = useState({
    name: "",
    total_point: "",
    description: "",
    status: "active",
  })
  const [editGiftImage, setEditGiftImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [currentGiftImage, setCurrentGiftImage] = useState<string | null>(null)

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

  const fetchGifts = async (page = 1, value = "") => {
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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admins/gift${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        setApiError("Authentication failed (401 Unauthorized). Your session may have expired.")
        localStorage.removeItem("token")
        return
      }

      let responseData: any
      try {
        responseData = await response.json()
      } catch (parseError) {
        setApiError(`Failed to parse server response. Status: ${response.status}`)
        setGifts([])
        return
      }

      if (response.ok) {
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch gifts")
          setGifts([])
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(0)
          return
        }

        if (responseData.data && responseData.data.data) {
          // Backend wraps data: response.data.data = { data: [...], meta, links }
          // Handle both nested ({data: {data: [...]}}) and flat ({data: [...]})
          const payload = responseData.data.data
          const giftsList = Array.isArray(payload) ? payload : payload.data || []
          const meta = payload.meta || {}
          setGifts(giftsList)
          setCurrentPage(meta.current_page ?? 1)
          setTotalPages(meta.last_page ?? 1)
          setTotalItems(meta.total ?? 0)
        } else {
          setApiError(`Unexpected data format from server.`)
          setGifts([])
        }
      } else {
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setGifts([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setGifts([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  const handleViewDetail = (gift: GiftData) => {
    setSelectedGift(gift)
    setIsDetailDialogOpen(true)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGifts()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchGifts(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchGifts(page, searchValue)
  }

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchGifts(1, "")
  }

  const stats = [
    {
      title: "Total Gifts",
      value: totalItems.toString(),
      description: "All registered gifts",
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Active Gifts",
      value: gifts.length.toString(),
      description: "Currently displayed",
      icon: Coins,
      color: "text-green-600",
    },
    {
      title: "With Images",
      value: gifts.filter((gift) => gift.image).length.toString(),
      description: "Gifts with images",
      icon: ImageIcon,
      color: "text-blue-600",
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

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("en-US").format(points)
  }

  const getGiftImage = (imagePath: string | null) => {
    if (!imagePath) return "/placeholder.svg?height=40&width=40"
    if (imagePath.startsWith("http")) return imagePath
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/storage/${imagePath}`
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setGiftImage(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setNewGift({
        name: "",
        total_point: "",
        description: "",
        status: "active",
      })
      setGiftImage(null)
      setImagePreview(null)
      setCreateMessage("")
    }
  }

  const createGift = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setCreateMessage("Authentication token not found. Please login again.")
        return
      }

      setIsCreatingGift(true)
      setCreateMessage("")

      const formData = new FormData()
      formData.append("name", newGift.name)
      formData.append("total_point", newGift.total_point)
      formData.append("status", newGift.status)

      if (newGift.description) {
        formData.append("description", newGift.description)
      }

      if (giftImage) {
        formData.append("image", giftImage)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/gift`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        setCreateMessage("Authentication failed (401 Unauthorized). Please login again.")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Gift Created", `Gift "${newGift.name}" has been successfully created.`)

        setNewGift({
          name: "",
          total_point: "",
          description: "",
          status: "active",
        })
        setGiftImage(null)
        setImagePreview(null)

        fetchGifts(currentPage, searchValue)

        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 2000)
      } else {
        setCreateMessage(data.message || `Failed to create gift (Status: ${response.status})`)
      }
    } catch (error) {
      setCreateMessage("Network error occurred while creating gift")
    } finally {
      setIsCreatingGift(false)
    }
  }

  const handleAddGift = () => {
    if (!newGift.name) {
      setCreateMessage("Please enter a gift name")
      return
    }
    if (!newGift.total_point) {
      setCreateMessage("Please enter total points")
      return
    }
    createGift()
  }

  const handleDeleteGift = (gift: GiftData) => {
    setGiftToDelete(gift)
    setIsDeleteDialogOpen(true)
    setDeleteMessage("")
  }

  const deleteGift = async () => {
    if (!giftToDelete) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setDeleteMessage("Authentication token not found. Please login again.")
        return
      }

      setIsDeletingGift(true)
      setDeleteMessage("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/gift/${giftToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        setDeleteMessage("Authentication failed (401 Unauthorized). Please login again.")
        localStorage.removeItem("token")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Gift Deleted", `Gift "${giftToDelete.name}" has been successfully deleted.`)

        fetchGifts(currentPage, searchValue)

        setTimeout(() => {
          setIsDeleteDialogOpen(false)
          setGiftToDelete(null)
          setDeleteMessage("")
        }, 1500)
      } else {
        setDeleteMessage(data.message || `Failed to delete gift (Status: ${response.status})`)
      }
    } catch (error) {
      setDeleteMessage("Network error occurred while deleting gift")
    } finally {
      setIsDeletingGift(false)
    }
  }

  const handleDeleteDialogClose = () => {
    if (!isDeletingGift) {
      setIsDeleteDialogOpen(false)
      setGiftToDelete(null)
      setDeleteMessage("")
    }
  }

  const handleEditGift = async (gift: GiftData) => {
    setGiftToEdit(gift)
    setIsEditDialogOpen(true)
    setEditMessage("")
    setIsLoadingEditData(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/gift-edit/${gift.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        setEditMessage("Authentication failed (401 Unauthorized). Please login again.")
        localStorage.removeItem("token")
        return
      }

      if (response.ok && data.success) {
        setEditGift({
          name: data.data.name || "",
          total_point: String(data.data.total_point ?? ""),
          description: data.data.description || "",
          status: data.data.status || "active",
        })
        setCurrentGiftImage(data.data.image)
        setEditImagePreview(null)
        setEditGiftImage(null)
      } else {
        setEditMessage(data.message || `Failed to load gift data (Status: ${response.status})`)
      }
    } catch (error) {
      setEditMessage("Network error occurred while loading gift data")
    } finally {
      setIsLoadingEditData(false)
    }
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setEditGiftImage(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setEditImagePreview(null)
    }
  }

  const handleEditDialogClose = () => {
    if (!isEditingGift && !isLoadingEditData) {
      setIsEditDialogOpen(false)
      setGiftToEdit(null)
      setEditMessage("")
      setEditGift({
        name: "",
        total_point: "",
        description: "",
        status: "active",
      })
      setEditGiftImage(null)
      setEditImagePreview(null)
      setCurrentGiftImage(null)
    }
  }

  const updateGift = async () => {
    if (!giftToEdit) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        return
      }

      setIsEditingGift(true)
      setEditMessage("")

      const formData = new FormData()
      formData.append("name", editGift.name)
      formData.append("total_point", editGift.total_point)
      formData.append("status", editGift.status)
      formData.append("_method", "PUT")

      if (editGift.description) {
        formData.append("description", editGift.description)
      }

      if (editGiftImage) {
        formData.append("image", editGiftImage)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/gift/${giftToEdit.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        setEditMessage("Authentication failed (401 Unauthorized). Please login again.")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Gift Updated", `Gift "${editGift.name}" has been successfully updated.`)

        fetchGifts(currentPage, searchValue)

        setTimeout(() => {
          setIsEditDialogOpen(false)
          setGiftToEdit(null)
          setEditMessage("")
        }, 2000)
      } else {
        setEditMessage(data.message || `Failed to update gift (Status: ${response.status})`)
      }
    } catch (error) {
      setEditMessage("Network error occurred while updating gift")
    } finally {
      setIsEditingGift(false)
    }
  }

  const handleUpdateGift = () => {
    if (!editGift.name) {
      setEditMessage("Please enter a gift name")
      return
    }
    if (!editGift.total_point) {
      setEditMessage("Please enter total points")
      return
    }
    updateGift()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gift Management</h1>
            <p className="text-slate-600 mt-2">Loading gift data...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
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
          <h1 className="text-3xl font-bold text-slate-900">Gift Management</h1>
          <p className="text-slate-600 mt-2">Manage redeemable gifts and their point values</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Gift
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Gift</DialogTitle>
              <DialogDescription>Create a new redeemable gift</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {createMessage && (
                <Alert
                  className={
                    createMessage.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription
                    className={createMessage.includes("successfully") ? "text-green-800" : "text-red-800"}
                  >
                    {createMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Gift Name *</Label>
                <Input
                  id="name"
                  value={newGift.name}
                  onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                  placeholder="Enter gift name"
                  disabled={isCreatingGift}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total_point">Total Points *</Label>
                <Input
                  id="total_point"
                  type="number"
                  min="0"
                  value={newGift.total_point}
                  onChange={(e) => setNewGift({ ...newGift, total_point: e.target.value })}
                  placeholder="Enter total points required"
                  disabled={isCreatingGift}
                />
                <p className="text-xs text-slate-500">Points needed to redeem this gift</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image">Gift Image</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isCreatingGift}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <div className="w-full h-32 rounded-md overflow-hidden border border-slate-200">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Image preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-slate-800/60 hover:bg-slate-800/80 text-white"
                        onClick={() => {
                          setGiftImage(null)
                          setImagePreview(null)
                        }}
                        disabled={isCreatingGift}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Upload a gift image (optional)</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGift.description}
                  onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                  placeholder="Enter gift description (optional)"
                  disabled={isCreatingGift}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newGift.status}
                  onChange={(e) => setNewGift({ ...newGift, status: e.target.value })}
                  disabled={isCreatingGift}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingGift}>
                Cancel
              </Button>
              <Button onClick={handleAddGift} disabled={isCreatingGift}>
                {isCreatingGift ? "Creating..." : "Create Gift"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
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
              <div className="font-medium">Error loading gifts:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchGifts(currentPage, searchValue)
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
              <CardTitle className="text-slate-900">Redeemable Gifts</CardTitle>
              <CardDescription>
                Showing {gifts.length} of {totalItems} gifts
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search gifts by name..."
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

          {searchValue && (
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              Searching for gift name "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gift</TableHead>
                <TableHead>Total Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.length > 0 ? (
                gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          {gift.image ? (
                            <Image
                              src={getGiftImage(gift.image) || "/placeholder.svg"}
                              alt={gift.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{gift.name}</p>
                          <p className="text-xs text-slate-500">ID: {gift.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-900">
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold">{formatPoints(gift.total_point)}</span>
                        <span className="text-xs text-slate-500">pts</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{gift.status}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(gift.created_at)}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(gift.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(gift)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-800"
                          onClick={() => handleEditGift(gift)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteGift(gift)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {searchValue ? `No gifts found with name matching "${searchValue}".` : "No gift data available."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} results
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
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
                    )
                  })}
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
              <Eye className="w-5 h-5 text-blue-600" />
              <span>Gift Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected gift</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedGift && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {selectedGift.image ? (
                      <Image
                        src={getGiftImage(selectedGift.image) || "/placeholder.svg"}
                        alt={selectedGift.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=64&width=64"
                        }}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{selectedGift.name}</h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-900">{formatPoints(selectedGift.total_point)} pts</span>
                    </div>
                    <span className="text-sm text-slate-600">{selectedGift.status}</span>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Gift Name</p>
                        <p className="text-slate-900">{selectedGift.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Total Points</p>
                        <p className="text-slate-900">{formatPoints(selectedGift.total_point)} pts</p>
                      </div>
                    </div>

                    {selectedGift.description && (
                      <div className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Description</p>
                          <p className="text-slate-900">{selectedGift.description}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Created At</p>
                        <p className="text-slate-900">{formatDateTime(selectedGift.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Updated At</p>
                        <p className="text-slate-900">{formatDateTime(selectedGift.updated_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Gift Image</p>
                        <p className="text-slate-900">{selectedGift.image ? "Available" : "No image"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gift Image Section */}
                {selectedGift.image && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Gift Image</h4>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-center">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-white shadow-sm">
                          <Image
                            src={getGiftImage(selectedGift.image) || "/placeholder.svg"}
                            alt={selectedGift.name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=128&width=128"
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 text-center mt-2">Image path: {selectedGift.image}</p>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Gift Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Gift ID:</span>
                      <span className="text-purple-900 font-medium">#{selectedGift.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Status:</span>
                      <span className="text-purple-900 font-medium">{selectedGift.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Has Image:</span>
                      <span className="text-purple-900 font-medium">{selectedGift.image ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Has Description:</span>
                      <span className="text-purple-900 font-medium">{selectedGift.description ? "Yes" : "No"}</span>
                    </div>
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
              <span>Delete Gift</span>
            </DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the gift.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {deleteMessage && (
              <Alert
                className={
                  deleteMessage.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }
              >
                <AlertDescription
                  className={deleteMessage.includes("successfully") ? "text-green-800" : "text-red-800"}
                >
                  {deleteMessage}
                </AlertDescription>
              </Alert>
            )}

            {giftToDelete && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {giftToDelete.image ? (
                      <Image
                        src={getGiftImage(giftToDelete.image) || "/placeholder.svg"}
                        alt={giftToDelete.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{giftToDelete.name}</p>
                    <div className="flex items-center space-x-1 text-sm text-amber-600">
                      <Coins className="w-3 h-3" />
                      <span>{formatPoints(giftToDelete.total_point)} pts</span>
                    </div>
                    <p className="text-xs text-slate-500">ID: {giftToDelete.id.slice(0, 8)}...</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Are you sure you want to delete this gift?</p>
                      <p className="mt-1">Gift "{giftToDelete.name}" will be permanently removed from the system.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteDialogClose} disabled={isDeletingGift}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteGift}
              disabled={isDeletingGift}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingGift ? "Deleting..." : "Delete Gift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Gift</DialogTitle>
            <DialogDescription>Update gift information</DialogDescription>
          </DialogHeader>

          {isLoadingEditData ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
              <span className="ml-2 text-slate-600">Loading gift data...</span>
            </div>
          ) : (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {editMessage && (
                <Alert
                  className={
                    editMessage.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription
                    className={editMessage.includes("successfully") ? "text-green-800" : "text-red-800"}
                  >
                    {editMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Gift Name *</Label>
                <Input
                  id="edit-name"
                  value={editGift.name}
                  onChange={(e) => setEditGift({ ...editGift, name: e.target.value })}
                  placeholder="Enter gift name"
                  disabled={isEditingGift}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-total_point">Total Points *</Label>
                <Input
                  id="edit-total_point"
                  type="number"
                  min="0"
                  value={editGift.total_point}
                  onChange={(e) => setEditGift({ ...editGift, total_point: e.target.value })}
                  placeholder="Enter total points required"
                  disabled={isEditingGift}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-image">Gift Image</Label>
                <div className="space-y-3">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    disabled={isEditingGift}
                    className="cursor-pointer"
                  />

                  <div className="space-y-2">
                    {editImagePreview ? (
                      <div className="relative">
                        <div className="w-full h-40 rounded-lg overflow-hidden border-2 border-dashed border-blue-300 bg-blue-50">
                          <Image
                            src={editImagePreview || "/placeholder.svg"}
                            alt="New gift image preview"
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md"
                          onClick={() => {
                            setEditGiftImage(null)
                            setEditImagePreview(null)
                          }}
                          disabled={isEditingGift}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove new image</span>
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          New Image
                        </div>
                      </div>
                    ) : currentGiftImage ? (
                      <div className="relative">
                        <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <Image
                            src={getGiftImage(currentGiftImage) || "/placeholder.svg"}
                            alt="Current gift image"
                            fill
                            className="object-contain p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=160&width=320"
                            }}
                          />
                        </div>
                        <div className="absolute bottom-2 left-2 bg-slate-600 text-white text-xs px-2 py-1 rounded">
                          Current Image
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No image uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editGift.description}
                  onChange={(e) => setEditGift({ ...editGift, description: e.target.value })}
                  placeholder="Enter gift description (optional)"
                  disabled={isEditingGift}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editGift.status}
                  onChange={(e) => setEditGift({ ...editGift, status: e.target.value })}
                  disabled={isEditingGift}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleEditDialogClose} disabled={isEditingGift || isLoadingEditData}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGift} disabled={isEditingGift || isLoadingEditData}>
              {isEditingGift ? "Updating..." : "Update Gift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
