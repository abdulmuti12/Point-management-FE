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
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  ImageIcon,
  FolderOpen,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Label } from "@/components/ui/label"

interface CategoryData {
  id: number
  name: string
  created_at: string
  image: string | null
}

interface CategoryDetailData {
  general: {
    id: number
    name: string
    created_at: string
    image: string | null
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
      data: CategoryData[]
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

export default function CategoryPage() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [apiError, setApiError] = useState("")
  const router = useRouter()

  // Add these state variables after the existing state declarations
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [createMessage, setCreateMessage] = useState("")
  const [newCategory, setNewCategory] = useState({
    name: "",
  })
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryData | null>(null)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [editMessage, setEditMessage] = useState("")
  const [editCategory, setEditCategory] = useState({
    name: "",
  })
  const [editCategoryImage, setEditCategoryImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [currentCategoryImage, setCurrentCategoryImage] = useState<string | null>(null)

  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")



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

  // Fetch categories data from API
  const fetchCategories = async (page = 1, value = "") => {
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

      const url = `${API_BASE_URL}/admins/category${params.toString() ? `?${params.toString()}` : ""}`


      console.log("Fetching categories from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)

      // Only redirect to login if we get a 401 Unauthorized
      if (response.status === 401) {
        console.log("Unauthorized access, redirecting to login")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      let responseData: any
      try {
        responseData = await response.json()
        console.log("API Response:", responseData)
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        setApiError(`Failed to parse server response. Status: ${response.status}`)
        setCategories([])
        return
      }

      if (response.ok) {
        // Check if response has success field and it's false
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch categories")
          setCategories([])
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
          const categoriesList = responseData.data.data.data
          setCategories(categoriesList)
          setCurrentPage(responseData.data.meta.current_page)
          setTotalPages(responseData.data.meta.last_page)
          setTotalItems(responseData.data.meta.total)
          console.log("Categories loaded successfully:", categoriesList.length, "categories")
        } else {
          console.error("Unexpected API response structure:", responseData)
          setApiError(
            `Unexpected data format from server. Expected array of categories but got: ${typeof responseData.data}`,
          )
          setCategories([])
        }
      } else {
        // Handle error response
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setCategories([])
        console.error("API Error:", errorMessage)
      }
    } catch (error) {
      console.error("Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setCategories([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Handle view detail
  const handleViewDetail = (category: CategoryData) => {
    setSelectedCategory(category)
    setIsDetailDialogOpen(true)
  }

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchCategories(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchCategories(page, searchValue)
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchCategories(1, "")
  }

  // Statistics based on current data
  const stats = [
    {
      title: "Total Categories",
      value: totalItems.toString(),
      description: "All registered categories",
      icon: FolderOpen,
      color: "text-blue-600",
    },
    {
      title: "Active Categories",
      value: categories.length.toString(),
      description: "Currently displayed",
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "With Images",
      value: categories.filter((category) => category.image).length.toString(),
      description: "Categories with images",
      icon: ImageIcon,
      color: "text-purple-600",
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

  const getCategoryImage = (imagePath: string | null) => {
    if (!imagePath) return "/placeholder.svg?height=40&width=40"

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http")) return imagePath

    // Otherwise, construct the full URL
    // return `http://31.97.67.48:8000/storage/${imagePath}`

    const storageBase = process.env.NEXT_PUBLIC_STORAGE_URL ?? "http://31.97.67.48:8000"
    return `${storageBase.replace(/\/$/, '')}/storage/${imagePath}`

  }

  // Add this function to handle file input change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setCategoryImage(file)

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
      setNewCategory({
        name: "",
      })
      setCategoryImage(null)
      setImagePreview(null)
      setCreateMessage("")
    }
  }

  // Add this function to create a new category
  const createCategory = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setCreateMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsCreatingCategory(true)
      setCreateMessage("")

      // Create FormData object to handle file upload
      const formData = new FormData()
      formData.append("name", newCategory.name)

      if (categoryImage) {
        formData.append("image", categoryImage)
      }

      const response = await fetch(`${API_BASE_URL}/admins/category`, {
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
        setCreateMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        // Show success toast
        addToast("success", "Category Created", `Category "${newCategory.name}" has been successfully created.`)

        // Reset form
        setNewCategory({
          name: "",
        })
        setCategoryImage(null)
        setImagePreview(null)

        // Refresh category list
        fetchCategories(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 2000)
      } else {
        setCreateMessage(data.message || `Failed to create category (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Create category API error:", error)
      setCreateMessage("Network error occurred while creating category")
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Add this function to handle form submission
  const handleAddCategory = () => {
    if (!newCategory.name) {
      setCreateMessage("Please enter a category name")
      return
    }

    createCategory()
  }

  // Handle delete category
  const handleDeleteCategory = (category: CategoryData) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
    setDeleteMessage("")
  }

  // Delete category function
  const deleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setDeleteMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsDeletingCategory(true)
      setDeleteMessage("")

      const response = await fetch(`${API_BASE_URL}/admins/category/${categoryToDelete.id}`, {
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
        // Show success toast
        addToast("success", "Category Deleted", `Category "${categoryToDelete.name}" has been successfully deleted.`)

        // Refresh category list
        fetchCategories(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsDeleteDialogOpen(false)
          setCategoryToDelete(null)
          setDeleteMessage("")
        }, 1500)
      } else {
        setDeleteMessage(data.message || `Failed to delete category (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Delete category API error:", error)
      setDeleteMessage("Network error occurred while deleting category")
    } finally {
      setIsDeletingCategory(false)
    }
  }

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    if (!isDeletingCategory) {
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      setDeleteMessage("")
    }
  }

  // Handle edit category
  const handleEditCategory = async (category: CategoryData) => {
    setCategoryToEdit(category)
    setIsEditDialogOpen(true)
    setEditMessage("")
    setIsLoadingEditData(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      // For now, we'll use the existing data since there's no specific edit endpoint mentioned
      // Populate form with existing data
      setEditCategory({
        name: category.name || "",
      })
      setCurrentCategoryImage(category.image)
      setEditImagePreview(null)
      setEditCategoryImage(null)
    } catch (error) {
      console.error("Load category data error:", error)
      setEditMessage("Error occurred while loading category data")
    } finally {
      setIsLoadingEditData(false)
    }
  }

  // Handle edit image change
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setEditCategoryImage(file)

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
    if (!isEditingCategory && !isLoadingEditData) {
      setIsEditDialogOpen(false)
      setCategoryToEdit(null)
      setEditMessage("")
      setEditCategory({
        name: "",
      })
      setEditCategoryImage(null)
      setEditImagePreview(null)
      setCurrentCategoryImage(null)
    }
  }

  // Update category function
  const updateCategory = async () => {
    if (!categoryToEdit) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsEditingCategory(true)
      setEditMessage("")

      // Create FormData object to handle file upload
      const formData = new FormData()
      formData.append("name", editCategory.name)
      formData.append("_method", "PUT")

      if (editCategoryImage) {
        formData.append("image", editCategoryImage)
      }

      const response = await fetch(`${API_BASE_URL}/admins/category/${categoryToEdit.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        setEditMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        // Show success toast
        addToast("success", "Category Updated", `Category "${editCategory.name}" has been successfully updated.`)

        // Refresh category list
        fetchCategories(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setCategoryToEdit(null)
          setEditMessage("")
        }, 2000)
      } else {
        setEditMessage(data.message || `Failed to update category (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Update category API error:", error)
      setEditMessage("Network error occurred while updating category")
    } finally {
      setIsEditingCategory(false)
    }
  }

  // Handle edit form submission
  const handleUpdateCategory = () => {
    if (!editCategory.name) {
      setEditMessage("Please enter a category name")
      return
    }

    updateCategory()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Category Management</h1>
            <p className="text-slate-600 mt-2">Loading category data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Category Management</h1>
          <p className="text-slate-600 mt-2">Manage product categories and their information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new product category</DialogDescription>
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
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                  disabled={isCreatingCategory}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image">Category Image</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isCreatingCategory}
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
                          setCategoryImage(null)
                          setImagePreview(null)
                        }}
                        disabled={isCreatingCategory}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Upload a category image (optional)</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingCategory}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isCreatingCategory}>
                {isCreatingCategory ? "Creating..." : "Create Category"}
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
              <div className="font-medium">Error loading categories:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchCategories(currentPage, searchValue)
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
              <CardTitle className="text-slate-900">Product Categories</CardTitle>
              <CardDescription>
                Showing {categories.length} of {totalItems} categories
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search categories by name..."
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
              Searching for category name "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          {category.image ? (
                            <Image
                              src={getCategoryImage(category.image) || "/placeholder.svg"}
                              alt={category.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          ) : (
                            <FolderOpen className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{category.name}</p>
                          <p className="text-xs text-slate-500">ID: {category.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(category.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-800"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    {searchValue
                      ? `No categories found with name matching "${searchValue}".`
                      : "No category data available."}
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
              <span>Category Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected category</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedCategory && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {selectedCategory.image ? (
                      <Image
                        src={getCategoryImage(selectedCategory.image) || "/placeholder.svg"}
                        alt={selectedCategory.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=64&width=64"
                        }}
                      />
                    ) : (
                      <FolderOpen className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{selectedCategory.name}</h3>
                    <p className="text-slate-600">Category ID: {selectedCategory.id}</p>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Category Name</p>
                        <p className="text-slate-900">{selectedCategory.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Created At</p>
                        <p className="text-slate-900">{formatDateTime(selectedCategory.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Category Image</p>
                        <p className="text-slate-900">{selectedCategory.image ? "Available" : "No image"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Image Section */}
                {selectedCategory.image && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Category Image</h4>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-center">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-white shadow-sm">
                          <Image
                            src={getCategoryImage(selectedCategory.image) || "/placeholder.svg"}
                            alt={selectedCategory.name}
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
                      <p className="text-xs text-slate-500 text-center mt-2">Image URL: {selectedCategory.image}</p>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Category Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Category ID:</span>
                      <span className="text-blue-900 font-medium">#{selectedCategory.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Has Image:</span>
                      <span className="text-blue-900 font-medium">{selectedCategory.image ? "Yes" : "No"}</span>
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
              <span>Delete Category</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the category.
            </DialogDescription>
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

            {categoryToDelete && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {categoryToDelete.image ? (
                      <Image
                        src={getCategoryImage(categoryToDelete.image) || "/placeholder.svg"}
                        alt={categoryToDelete.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    ) : (
                      <FolderOpen className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{categoryToDelete.name}</p>
                    <p className="text-xs text-slate-500">ID: {categoryToDelete.id}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Are you sure you want to delete this category?</p>
                      <p className="mt-1">
                        Category "{categoryToDelete.name}" will be permanently removed from the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteDialogClose} disabled={isDeletingCategory}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCategory}
              disabled={isDeletingCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingCategory ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information</DialogDescription>
          </DialogHeader>

          {isLoadingEditData ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
              <span className="ml-2 text-slate-600">Loading category data...</span>
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
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                  placeholder="Enter category name"
                  disabled={isEditingCategory}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-image">Category Image</Label>
                <div className="space-y-3">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    disabled={isEditingCategory}
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
                            alt="New category image preview"
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
                            setEditCategoryImage(null)
                            setEditImagePreview(null)
                          }}
                          disabled={isEditingCategory}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove new image</span>
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          New Image
                        </div>
                      </div>
                    ) : currentCategoryImage ? (
                      // Current existing image
                      <div className="relative">
                        <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <Image
                            src={getCategoryImage(currentCategoryImage) || "/placeholder.svg"}
                            alt="Current category image"
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
                        : currentCategoryImage
                          ? "Current category image - upload a new file to replace"
                          : "Upload a category image (optional)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleEditDialogClose} disabled={isEditingCategory || isLoadingEditData}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={isEditingCategory || isLoadingEditData}
              className="bg-green-600 hover:bg-green-700"
            >
              {isEditingCategory ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
