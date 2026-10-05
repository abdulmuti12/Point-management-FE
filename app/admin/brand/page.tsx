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
  Award,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  ImageIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface BrandData {
  id: number
  name: string
  note: string | null
  image: string | null
  description: string
  created_at: string
  updated_at: string
  link: string // Added link field
}

interface BrandDetailData {
  general: {
    id: number
    name: string
    note: string | null
    image: string | null
    description: string
    created_at: string
    updated_at: string
    link: string // Added link field
  }
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
      data: BrandData[]
    }
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

export default function BrandPage() {
  const [brands, setBrands] = useState<BrandData[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<BrandData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [apiError, setApiError] = useState("")
  const router = useRouter()

  // Add these state variables after the existing state declarations
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreatingBrand, setIsCreatingBrand] = useState(false)
  const [createMessage, setCreateMessage] = useState("")
  const [newBrand, setNewBrand] = useState({
    name: "",
    description: "",
    note: "",
    link: "", // Added link field
  })
  const [brandImage, setBrandImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<BrandData | null>(null)
  const [isDeletingBrand, setIsDeletingBrand] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [brandToEdit, setBrandToEdit] = useState<BrandData | null>(null)
  const [isEditingBrand, setIsEditingBrand] = useState(false)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [editMessage, setEditMessage] = useState("")
  const [editBrand, setEditBrand] = useState({
    name: "",
    description: "",
    note: "",
    link: "", // Added link field
  })
  const [editBrandImage, setEditBrandImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [currentBrandImage, setCurrentBrandImage] = useState<string | null>(null)

  // Toast notification functions
  const addToast = (type: "success" | "error", title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastNotification = { id, type, title, message }
    setToasts((prev) => [...prev, newToast])

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Fetch brands data from API
  const fetchBrands = async (page = 1, value = "") => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("[v0] No authentication token found in fetchBrands")
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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admins/brand${params.toString() ? `?${params.toString()}` : ""}`

      console.log("Fetching brands from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)

      if (response.status === 401) {
        console.error("[v0] 401 Unauthorized in fetchBrands - Token may be expired")
        setApiError("Authentication failed (401 Unauthorized). Your session may have expired.")
        localStorage.removeItem("token")
        // Optional: Uncomment to redirect after 3 seconds
        // setTimeout(() => router.push("/login"), 3000)
        return
      }

      let responseData: any
      try {
        responseData = await response.json()
        console.log("API Response:", responseData)
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        setApiError(`Failed to parse server response. Status: ${response.status}`)
        setBrands([])
        return
      }

      if (response.ok) {
        // Check if response has success field and it's false
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch brands")
          setBrands([])
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(0)
          return
        }

        // Extract data from the correct structure: data.data.data
        if (
          responseData.data &&
          responseData.data.data &&
          responseData.data.data.data &&
          Array.isArray(responseData.data.data.data)
        ) {
          const brandsList = responseData.data.data.data
          setBrands(brandsList)
          setCurrentPage(responseData.data.meta.current_page)
          setTotalPages(responseData.data.meta.last_page)
          setTotalItems(responseData.data.meta.total)
          console.log("Brands loaded successfully:", brandsList.length, "brands")
        } else {
          console.error("Unexpected API response structure:", responseData)
          setApiError(
            `Unexpected data format from server. Expected array of brands but got: ${typeof responseData.data}`,
          )
          setBrands([])
        }
      } else {
        // Handle error response
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setBrands([])
        console.error("API Error:", errorMessage)
      }
    } catch (error) {
      console.error("Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setBrands([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Handle view detail
  const handleViewDetail = (brand: BrandData) => {
    setSelectedBrand(brand)
    setIsDetailDialogOpen(true)
  }

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrands()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchBrands(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchBrands(page, searchValue)
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchBrands(1, "")
  }

  // Statistics based on current data
  const stats = [
    {
      title: "Total Brands",
      value: totalItems.toString(),
      description: "All registered brands",
      icon: Award,
      color: "text-purple-600",
    },
    {
      title: "Active Brands",
      value: brands.length.toString(),
      description: "Currently displayed",
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "With Images",
      value: brands.filter((brand) => brand.image).length.toString(),
      description: "Brands with images",
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

  const getBrandImage = (imagePath: string | null) => {
    if (!imagePath) return "/placeholder.svg?height=40&width=40"

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http")) return imagePath

    // Otherwise, construct the full URL
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/storage/${imagePath}`
  }

  // Add this function to handle file input change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setBrandImage(file)

    // Create preview URL for the selected image
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

  // Add this function to handle add dialog open/close
  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      // Reset form when closing
      setNewBrand({
        name: "",
        description: "",
        note: "",
        link: "", // Reset link field
      })
      setBrandImage(null)
      setImagePreview(null)
      setCreateMessage("")
    }
  }

  // Add this function to create a new brand
  const createBrand = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("[v0] No authentication token found in createBrand")
        setCreateMessage("Authentication token not found. Please login again.")
        return
      }

      setIsCreatingBrand(true)
      setCreateMessage("")

      // Create FormData object to handle file upload
      const formData = new FormData()
      formData.append("name", newBrand.name)
      formData.append("description", newBrand.description)

      if (newBrand.note) {
        formData.append("note", newBrand.note)
      }

      if (newBrand.link) {
        formData.append("link", newBrand.link)
      }

      if (brandImage) {
        formData.append("image", brandImage)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/brand`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
          // It will be set automatically with the correct boundary
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        console.log(response);
        console.error("[v0] 401 Unauthorized in createBrand - Token may be expired")
        setCreateMessage("Authentication failed (401 Unauthorized). Please login again.")
        // localStorage.removeItem("token")
        return
      }

      if (response.ok && data.success) {
        // Show success toast
        addToast("success", "Brand Created", `Brand "${newBrand.name}" has been successfully created.`)

        // Reset form
        setNewBrand({
          name: "",
          description: "",
          note: "",
          link: "", // Reset link field
        })
        setBrandImage(null)
        setImagePreview(null)

        // Refresh brand list
        fetchBrands(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 2000)
      } else {
        setCreateMessage(data.message || `Failed to create brand (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Create brand API error:", error)
      setCreateMessage("Network error occurred while creating brand")
    } finally {
      setIsCreatingBrand(false)
    }
  }

  // Add this function to handle form submission
  const handleAddBrand = () => {
    if (!newBrand.name) {
      setCreateMessage("Please enter a brand name")
      return
    }

    createBrand()
  }

  // Handle delete brand
  const handleDeleteBrand = (brand: BrandData) => {
    setBrandToDelete(brand)
    setIsDeleteDialogOpen(true)
    setDeleteMessage("")
  }

  // Delete brand function
  const deleteBrand = async () => {
    if (!brandToDelete) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("[v0] No authentication token found in deleteBrand")
        setDeleteMessage("Authentication token not found. Please login again.")
        return
      }

      setIsDeletingBrand(true)
      setDeleteMessage("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/brand/${brandToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        console.error("[v0] 401 Unauthorized in deleteBrand - Token may be expired")
        setDeleteMessage("Authentication failed (401 Unauthorized). Please login again.")
        localStorage.removeItem("token")
        return
      }

      if (response.ok && data.success) {
        // Show success toast
        addToast("success", "Brand Deleted", `Brand "${brandToDelete.name}" has been successfully deleted.`)

        // Refresh brand list
        fetchBrands(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsDeleteDialogOpen(false)
          setBrandToDelete(null)
          setDeleteMessage("")
        }, 1500)
      } else {
        setDeleteMessage(data.message || `Failed to delete brand (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Delete brand API error:", error)
      setDeleteMessage("Network error occurred while deleting brand")
    } finally {
      setIsDeletingBrand(false)
    }
  }

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    if (!isDeletingBrand) {
      setIsDeleteDialogOpen(false)
      setBrandToDelete(null)
      setDeleteMessage("")
    }
  }

  // Handle edit brand
  const handleEditBrand = async (brand: BrandData) => {
    setBrandToEdit(brand)
    setIsEditDialogOpen(true)
    setEditMessage("")
    setIsLoadingEditData(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("[v0] No authentication token found in handleEditBrand")
        setEditMessage("Authentication token not found. Please login again.")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/brand-edit/${brand.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        console.error("[v0] 401 Unauthorized in handleEditBrand - Token may be expired")
        setEditMessage("Authentication failed (401 Unauthorized). Please login again.")
        localStorage.removeItem("token")
        return
      }

      if (response.ok && data.success) {
        // Populate form with existing data
        setEditBrand({
          name: data.data.name || "",
          description: data.data.description || "",
          note: data.data.note || "",
          link: data.data.link || "", // Added link field to editBrand state
        })
        setCurrentBrandImage(data.data.image)
        setEditImagePreview(null)
        setEditBrandImage(null)
      } else {
        setEditMessage(data.message || `Failed to load brand data (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Load brand data API error:", error)
      setEditMessage("Network error occurred while loading brand data")
    } finally {
      setIsLoadingEditData(false)
    }
  }

  // Handle edit image change
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setEditBrandImage(file)

    // Create preview URL for the selected image
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

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    if (!isEditingBrand && !isLoadingEditData) {
      setIsEditDialogOpen(false)
      setBrandToEdit(null)
      setEditMessage("")
      setEditBrand({
        name: "",
        description: "",
        note: "",
        link: "", // Reset link field
      })
      setEditBrandImage(null)
      setEditImagePreview(null)
      setCurrentBrandImage(null)
    }
  }

  // Update brand function
  const updateBrand = async () => {
    if (!brandToEdit) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("[v0] No authentication token found in updateBrand")
        setEditMessage("Authentication token not found. Please login again.")
        return
      }

      setIsEditingBrand(true)
      setEditMessage("")

      // Create FormData object to handle file upload
      const formData = new FormData()
      formData.append("name", editBrand.name)
      formData.append("description", editBrand.description)
      formData.append("_method", "PUT")

      if (editBrand.note) {
        formData.append("note", editBrand.note)
      }

      if (editBrand.link) {
        formData.append("link", editBrand.link)
      }

      if (editBrandImage) {
        formData.append("image", editBrandImage)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/brand/${brandToEdit.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        console.error("[v0] 401 Unauthorized in updateBrand - Token may be expired")
        setEditMessage("Authentication failed (401 Unauthorized). Please login again.")
        localStorage.removeItem("token")
        return
      }

      if (response.ok && data.success) {
        // Show success toast
        addToast("success", "Brand Updated", `Brand "${editBrand.name}" has been successfully updated.`)

        // Refresh brand list
        fetchBrands(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setBrandToEdit(null)
          setEditMessage("")
        }, 2000)
      } else {
        setEditMessage(data.message || `Failed to update brand (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Update brand API error:", error)
      setEditMessage("Network error occurred while updating brand")
    } finally {
      setIsEditingBrand(false)
    }
  }

  // Handle edit form submission
  const handleUpdateBrand = () => {
    if (!editBrand.name) {
      setEditMessage("Please enter a brand name")
      return
    }

    updateBrand()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Brand Management</h1>
            <p className="text-slate-600 mt-2">Loading brand data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Brand Management</h1>
          <p className="text-slate-600 mt-2">Manage product brands and their information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
              <DialogDescription>Create a new product brand</DialogDescription>
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
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  placeholder="Enter brand name"
                  disabled={isCreatingBrand}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link">Brand Link</Label>
                <Input
                  id="link"
                  type="url"
                  value={newBrand.link}
                  onChange={(e) => setNewBrand({ ...newBrand, link: e.target.value })}
                  placeholder="https://example.com"
                  disabled={isCreatingBrand}
                />
                <p className="text-xs text-slate-500">Enter the brand's website URL (optional)</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image">Brand Image</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isCreatingBrand}
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
                          setBrandImage(null)
                          setImagePreview(null)
                        }}
                        disabled={isCreatingBrand}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Upload a brand logo or image (optional)</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newBrand.description}
                  onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                  placeholder="Enter brand description"
                  disabled={isCreatingBrand}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={newBrand.note}
                  onChange={(e) => setNewBrand({ ...newBrand, note: e.target.value })}
                  placeholder="Enter additional notes (optional)"
                  disabled={isCreatingBrand}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingBrand}>
                Cancel
              </Button>
              <Button onClick={handleAddBrand} disabled={isCreatingBrand}>
                {isCreatingBrand ? "Creating..." : "Create Brand"}
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
              <div className="font-medium">Error loading brands:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchBrands(currentPage, searchValue)
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
              <CardTitle className="text-slate-900">Product Brands</CardTitle>
              <CardDescription>
                Showing {brands.length} of {totalItems} brands
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search brands by name..."
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
              Searching for brand name "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          {brand.image ? (
                            <Image
                              src={getBrandImage(brand.image) || "/placeholder.svg"}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          ) : (
                            <Award className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{brand.name}</p>
                          <p className="text-xs text-slate-500">ID: {brand.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-xs">
                      <p className="truncate">{brand.description || "No description"}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {brand.note ? (
                        <Badge variant="outline" className="text-xs">
                          {brand.note}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">No note</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(brand.created_at)}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(brand.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(brand)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-800"
                          onClick={() => handleEditBrand(brand)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteBrand(brand)}
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
                    {searchValue ? `No brands found with name matching "${searchValue}".` : "No brand data available."}
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
              <span>Brand Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected brand</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedBrand && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {selectedBrand.image ? (
                      <Image
                        src={getBrandImage(selectedBrand.image) || "/placeholder.svg"}
                        alt={selectedBrand.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=64&width=64"
                        }}
                      />
                    ) : (
                      <Award className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{selectedBrand.name}</h3>
                    <p className="text-slate-600">{selectedBrand.description || "No description"}</p>
                    {selectedBrand.note && (
                      <Badge variant="outline" className="mt-2">
                        {selectedBrand.note}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Award className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Brand Name</p>
                        <p className="text-slate-900">{selectedBrand.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Description</p>
                        <p className="text-slate-900">{selectedBrand.description || "No description"}</p>
                      </div>
                    </div>

                    {selectedBrand.note && (
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Note</p>
                          <p className="text-slate-900">{selectedBrand.note}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Created At</p>
                        <p className="text-slate-900">{formatDateTime(selectedBrand.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Updated At</p>
                        <p className="text-slate-900">{formatDateTime(selectedBrand.updated_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Brand Image</p>
                        <p className="text-slate-900">{selectedBrand.image ? "Available" : "No image"}</p>
                      </div>
                    </div>

                    {/* Added link detail */}
                    {selectedBrand.link && (
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Brand Link</p>
                          <p className="text-slate-900">
                            <a
                              href={selectedBrand.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedBrand.link}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand Image Section */}
                {selectedBrand.image && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Brand Image</h4>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-center">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-white shadow-sm">
                          <Image
                            src={getBrandImage(selectedBrand.image) || "/placeholder.svg"}
                            alt={selectedBrand.name}
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
                      <p className="text-xs text-slate-500 text-center mt-2">Image path: {selectedBrand.image}</p>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Brand Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Brand ID:</span>
                      <span className="text-purple-900 font-medium">#{selectedBrand.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Has Image:</span>
                      <span className="text-purple-900 font-medium">{selectedBrand.image ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Has Note:</span>
                      <span className="text-purple-900 font-medium">{selectedBrand.note ? "Yes" : "No"}</span>
                    </div>
                    {/* Added link info */}
                    <div className="flex justify-between">
                      <span className="text-purple-700">Has Link:</span>
                      <span className="text-purple-900 font-medium">{selectedBrand.link ? "Yes" : "No"}</span>
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
              <span>Delete Brand</span>
            </DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the brand.</DialogDescription>
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

            {brandToDelete && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {brandToDelete.image ? (
                      <Image
                        src={getBrandImage(brandToDelete.image) || "/placeholder.svg"}
                        alt={brandToDelete.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    ) : (
                      <Award className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{brandToDelete.name}</p>
                    <p className="text-sm text-slate-600">{brandToDelete.description}</p>
                    <p className="text-xs text-slate-500">ID: {brandToDelete.id}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Are you sure you want to delete this brand?</p>
                      <p className="mt-1">Brand "{brandToDelete.name}" will be permanently removed from the system.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteDialogClose} disabled={isDeletingBrand}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteBrand}
              disabled={isDeletingBrand}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingBrand ? "Deleting..." : "Delete Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update brand information</DialogDescription>
          </DialogHeader>

          {isLoadingEditData ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
              <span className="ml-2 text-slate-600">Loading brand data...</span>
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
                <Label htmlFor="edit-name">Brand Name *</Label>
                <Input
                  id="edit-name"
                  value={editBrand.name}
                  onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                  placeholder="Enter brand name"
                  disabled={isEditingBrand}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-link">Brand Link</Label>
                <Input
                  id="edit-link"
                  type="url"
                  value={editBrand.link}
                  onChange={(e) => setEditBrand({ ...editBrand, link: e.target.value })}
                  placeholder="https://example.com"
                  disabled={isEditingBrand}
                />
                <p className="text-xs text-slate-500">Enter the brand's website URL (optional)</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-image">Brand Image</Label>
                <div className="space-y-3">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    disabled={isEditingBrand}
                    className="cursor-pointer"
                  />

                  {/* Image Preview Section */}
                  <div className="space-y-2">
                    {editImagePreview ? (
                      // New image selected
                      <div className="relative">
                        <div className="w-full h-40 rounded-lg overflow-hidden border-2 border-dashed border-blue-300 bg-blue-50">
                          <Image
                            src={editImagePreview || "/placeholder.svg"}
                            alt="New brand image preview"
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
                            setEditBrandImage(null)
                            setEditImagePreview(null)
                          }}
                          disabled={isEditingBrand}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove new image</span>
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          New Image
                        </div>
                      </div>
                    ) : currentBrandImage ? (
                      // Current existing image
                      <div className="relative">
                        <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <Image
                            src={getBrandImage(currentBrandImage) || "/placeholder.svg"}
                            alt="Current brand image"
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
                      // No image placeholder
                      <div className="w-full h-40 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No image uploaded</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      {editImagePreview
                        ? "New image selected - will replace current image when saved"
                        : currentBrandImage
                          ? "Current brand image - upload a new file to replace"
                          : "Upload a brand logo or image (optional)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editBrand.description}
                  onChange={(e) => setEditBrand({ ...editBrand, description: e.target.value })}
                  placeholder="Enter brand description"
                  disabled={isEditingBrand}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-note">Note</Label>
                <Textarea
                  id="edit-note"
                  value={editBrand.note}
                  onChange={(e) => setEditBrand({ ...editBrand, note: e.target.value })}
                  placeholder="Enter additional notes (optional)"
                  disabled={isEditingBrand}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleEditDialogClose} disabled={isEditingBrand || isLoadingEditData}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBrand} disabled={isEditingBrand || isLoadingEditData}>
              {isEditingBrand ? "Updating..." : "Update Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
