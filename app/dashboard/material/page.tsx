"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  Package2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  FileText,
  Layers,
  Upload,
  ImageIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface MaterialData {
  id: number
  name: string
  description: string | null
  file: string | null
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
      data: MaterialData[]
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

export default function MaterialPage() {
  const [materials, setMaterials] = useState<MaterialData[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialData | null>(null)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [apiError, setApiError] = useState("")
  const router = useRouter()

  // Add dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false)
  const [createMessage, setCreateMessage] = useState("")
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    description: "",
    file: null as File | null,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<MaterialData | null>(null)
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [materialToEdit, setMaterialToEdit] = useState<MaterialData | null>(null)
  const [isEditingMaterial, setIsEditingMaterial] = useState(false)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [editMessage, setEditMessage] = useState("")
  const [editMaterial, setEditMaterial] = useState({
    name: "",
    description: "",
    file: null as File | null,
  })
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [originalEditImageUrl, setOriginalEditImageUrl] = useState<string | null>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Helper function to get full image URL
  const getImageUrl = (filePath: string | null) => {
    if (!filePath) return null

    // If it's already a full URL, return as is
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath
    }

    // Base URL for the Laravel storage
    // const baseUrl = "http://127.0.0.1:8000/storage"
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL ? process.env.NEXT_PUBLIC_STORAGE_URL: "http://127.0.0.1:8000/storage/"


    // Handle different path formats
    if (filePath.startsWith("/")) {
      return `${baseUrl}${filePath}`
    } else {
      return `${baseUrl}/${filePath}`
    }
  }

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

  // Handle file selection for create
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setCreateMessage("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCreateMessage("Image size should be less than 5MB")
        return
      }

      setNewMaterial({ ...newMaterial, file: file })

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setCreateMessage("")
    }
  }

  // Handle file selection for edit
  const handleEditFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setEditMessage("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setEditMessage("Image size should be less than 5MB")
        return
      }

      setEditMaterial({ ...editMaterial, file: file })

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setEditMessage("")
    }
  }

  // Remove image for create
  const removeImage = () => {
    setNewMaterial({ ...newMaterial, file: null })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove image for edit
  const removeEditImage = () => {
    setEditMaterial({ ...editMaterial, file: null })
    setEditImagePreview(null)
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ""
    }
  }

  // Fetch materials data from API
  const fetchMaterials = async (page = 1, value = "") => {
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

      // const url = `http://127.0.0.1:8000/api/admins/made${params.toString() ? `?${params.toString()}` : ""}`
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/made${params.toString() ? `?${params.toString()}` : ""}`

      console.log("Fetching materials from:", url)

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
        setMaterials([])
        return
      }

      if (response.ok) {
        // Check if response has success field and it's false
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch materials")
          setMaterials([])
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
          const materialsList = responseData.data.data.data
          console.log("Raw materials data:", materialsList)

          // Log file paths for debugging
          materialsList.forEach((material: MaterialData) => {
            console.log(`Material ${material.id} - ${material.name}:`, {
              originalFile: material.file,
              processedImageUrl: getImageUrl(material.file),
            })
          })

          setMaterials(materialsList)
          setCurrentPage(responseData.data.meta.current_page)
          setTotalPages(responseData.data.meta.last_page)
          setTotalItems(responseData.data.meta.total)
          console.log("Materials loaded successfully:", materialsList.length, "materials")
        } else {
          console.error("Unexpected API response structure:", responseData)
          setApiError(
            `Unexpected data format from server. Expected array of materials but got: ${typeof responseData.data}`,
          )
          setMaterials([])
        }
      } else {
        // Handle error response
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setMaterials([])
        console.error("API Error:", errorMessage)
      }
    } catch (error) {
      console.error("Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setMaterials([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Handle view detail
  const handleViewDetail = (material: MaterialData) => {
    setSelectedMaterial(material)
    setIsDetailDialogOpen(true)
  }

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchMaterials(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchMaterials(page, searchValue)
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchMaterials(1, "")
  }

  // Statistics based on current data
  const stats = [
    {
      title: "Total Materials",
      value: totalItems.toString(),
      description: "All registered materials",
      icon: Package2,
      color: "text-blue-600",
    },
    {
      title: "Active Materials",
      value: materials.length.toString(),
      description: "Currently displayed",
      icon: Layers,
      color: "text-green-600",
    },
    {
      title: "With Images",
      value: materials.filter((material) => material.file).length.toString(),
      description: "Materials with images",
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

  // Add dialog handlers
  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setNewMaterial({
        name: "",
        description: "",
        file: null,
      })
      setImagePreview(null)
      setCreateMessage("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Create material function
  const createMaterial = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setCreateMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsCreatingMaterial(true)
      setCreateMessage("")

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("name", newMaterial.name)
      formData.append("description", newMaterial.description)

      // Only append file if it exists
      if (newMaterial.file) {
        formData.append("file", newMaterial.file)
        console.log("File being uploaded:", newMaterial.file.name, newMaterial.file.type, newMaterial.file.size)
      }

      console.log("FormData contents:")
      for (const [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/made`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })


      console.log("Create response status:", response.status)
      const data = await response.json()
      console.log("Create response data:", data)

      if (response.status === 401) {
        setCreateMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        addToast("success", "Material Created", `Material "${newMaterial.name}" has been successfully created.`)
        setNewMaterial({
          name: "",
          description: "",
          file: null,
        })
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        fetchMaterials(currentPage, searchValue)
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 2000)
      } else {
        setCreateMessage(data.message || `Failed to create material (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Create material API error:", error)
      setCreateMessage("Network error occurred while creating material")
    } finally {
      setIsCreatingMaterial(false)
    }
  }

  const handleAddMaterial = () => {
    if (!newMaterial.name) {
      setCreateMessage("Please enter a material name")
      return
    }
    createMaterial()
  }

  // Delete handlers
  const handleDeleteMaterial = (material: MaterialData) => {
    setMaterialToDelete(material)
    setIsDeleteDialogOpen(true)
    setDeleteMessage("")
  }

  const deleteMaterial = async () => {
    if (!materialToDelete) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setDeleteMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsDeletingMaterial(true)
      setDeleteMessage("")

       const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/made/${materialToDelete.id}`

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
        addToast("success", "Material Deleted", `Material "${materialToDelete.name}" has been successfully deleted.`)
        fetchMaterials(currentPage, searchValue)
        setTimeout(() => {
          setIsDeleteDialogOpen(false)
          setMaterialToDelete(null)
          setDeleteMessage("")
        }, 1500)
      } else {
        setDeleteMessage(data.message || `Failed to delete material (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Delete material API error:", error)
      setDeleteMessage("Network error occurred while deleting material")
    } finally {
      setIsDeletingMaterial(false)
    }
  }

  const handleDeleteDialogClose = () => {
    if (!isDeletingMaterial) {
      setIsDeleteDialogOpen(false)
      setMaterialToDelete(null)
      setDeleteMessage("")
    }
  }

  // Edit handlers
  const handleEditMaterial = async (material: MaterialData) => {
    setMaterialToEdit(material)
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

      // const response = await fetch(`http://127.0.0.1:8000/api/admins/made-edit/${material.id}`, {
      //   method: "GET",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     "Content-Type": "application/json",
      //   },
      // })
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
     const url = `${apiBase}/admins/made-edit/${material.id}`

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
        setEditMaterial({
          name: data.data.name || "",
          description: data.data.description || "",
          file: null, // Always start with null for new file selection
        })

        // Set existing image preview if available
        const existingImageUrl = getImageUrl(data.data.file)
        setOriginalEditImageUrl(existingImageUrl)
        setEditImagePreview(existingImageUrl)

        console.log("Edit data loaded:", {
          name: data.data.name,
          description: data.data.description,
          file: data.data.file,
          imageUrl: existingImageUrl,
        })
      } else {
        setEditMessage(data.message || `Failed to load material data (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Load material data API error:", error)
      setEditMessage("Network error occurred while loading material data")
    } finally {
      setIsLoadingEditData(false)
    }
  }

  const handleEditDialogClose = () => {
    if (!isEditingMaterial && !isLoadingEditData) {
      setIsEditDialogOpen(false)
      setMaterialToEdit(null)
      setEditMessage("")
      setEditMaterial({
        name: "",
        description: "",
        file: null,
      })
      setEditImagePreview(null)
      setOriginalEditImageUrl(null)
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ""
      }
    }
  }

  const updateMaterial = async () => {
    if (!materialToEdit) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsEditingMaterial(true)
      setEditMessage("")

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("name", editMaterial.name.trim())
      formData.append("description", editMaterial.description.trim())

      // Add method spoofing for Laravel
      formData.append("_method", "PUT")

      // Always append file field, even if null
      if (editMaterial.file) {
        formData.append("file", editMaterial.file)
        console.log("New file being uploaded for edit:", {
          name: editMaterial.file.name,
          type: editMaterial.file.type,
          size: editMaterial.file.size,
        })
      } else {
        console.log("No new file selected for update")
      }

      // Debug FormData contents
      console.log("Update FormData contents:")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            type: value.type,
            size: value.size,
          })
        } else {
          console.log(`${key}:`, value)
        }
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "")
      const url = `${apiBase}/admins/made/${materialToEdit.id}`

      const response = await fetch(url, {
        method: "POST", // Use POST with _method for Laravel file uploads
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
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
        addToast("success", "Material Updated", `Material "${editMaterial.name}" has been successfully updated.`)
        fetchMaterials(currentPage, searchValue)
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setMaterialToEdit(null)
          setEditMessage("")
          setEditMaterial({
            name: "",
            description: "",
            file: null,
          })
          setEditImagePreview(null)
          setOriginalEditImageUrl(null)
        }, 2000)
      } else {
        const errorMessage = data?.message || `Failed to update material (Status: ${response.status})`
        setEditMessage(errorMessage)
        console.error("Update failed:", errorMessage)
      }
    } catch (error) {
      console.error("Update material API error:", error)
      setEditMessage("Network error occurred while updating material")
    } finally {
      setIsEditingMaterial(false)
    }
  }

  const handleUpdateMaterial = () => {
    if (!editMaterial.name.trim()) {
      setEditMessage("Please enter a material name")
      return
    }
    updateMaterial()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Material Management</h1>
            <p className="text-slate-600 mt-2">Loading material data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Material Management</h1>
          <p className="text-slate-600 mt-2">Manage materials and their information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>Create a new material with image</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  placeholder="Enter material name"
                  disabled={isCreatingMaterial}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="Enter material description (optional)"
                  disabled={isCreatingMaterial}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="file">Material Image</Label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isCreatingMaterial}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCreatingMaterial}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {newMaterial.file ? "Change Image" : "Upload Image"}
                  </Button>

                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        disabled={isCreatingMaterial}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-slate-500">Supported formats: JPG, PNG, GIF. Max size: 5MB</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingMaterial}>
                Cancel
              </Button>
              <Button onClick={handleAddMaterial} disabled={isCreatingMaterial}>
                {isCreatingMaterial ? "Creating..." : "Create Material"}
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
              <div className="font-medium">Error loading materials:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchMaterials(currentPage, searchValue)
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
              <CardTitle className="text-slate-900">Materials</CardTitle>
              <CardDescription>
                Showing {materials.length} of {totalItems} materials
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search materials by name..."
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
              Searching for material name "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length > 0 ? (
                materials.map((material) => {
                  const imageUrl = getImageUrl(material.file)
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl || "/placeholder.svg"}
                                alt={material.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log(`Failed to load image for ${material.name}:`, imageUrl)
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                  const nextSibling = target.nextElementSibling as HTMLElement
                                  if (nextSibling) {
                                    nextSibling.classList.remove("hidden")
                                  }
                                }}
                              />
                            ) : null}
                            <Package2 className={`w-5 h-5 text-slate-400 ${imageUrl ? "hidden" : ""}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{material.name}</p>
                            <p className="text-xs text-slate-500">ID: {material.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs">
                        <p className="truncate">{material.description || "No description"}</p>
                      </TableCell>
                      <TableCell>
                        {imageUrl ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border">
                            <img
                              src={imageUrl || "/placeholder.svg"}
                              alt={material.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`Failed to load table image for ${material.name}:`, imageUrl)
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full bg-slate-100 flex items-center justify-center">
                                      <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                    </div>
                                  `
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{formatDate(material.created_at)}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(material.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(material)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-800"
                            onClick={() => handleEditMaterial(material)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteMaterial(material)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {searchValue
                      ? `No materials found with name matching "${searchValue}".`
                      : "No material data available."}
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
              <span>Material Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected material</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedMaterial && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {getImageUrl(selectedMaterial.file) ? (
                      <img
                        src={getImageUrl(selectedMaterial.file)! || "/placeholder.svg"}
                        alt={selectedMaterial.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const nextSibling = target.nextElementSibling as HTMLElement
                          if (nextSibling) {
                            nextSibling.classList.remove("hidden")
                          }
                        }}
                      />
                    ) : null}
                    <Package2
                      className={`w-8 h-8 text-slate-600 ${getImageUrl(selectedMaterial.file) ? "hidden" : ""}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{selectedMaterial.name}</h3>
                    <p className="text-slate-600">{selectedMaterial.description || "No description"}</p>
                  </div>
                </div>

                {/* Image Section */}
                {getImageUrl(selectedMaterial.file) && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Material Image</h4>
                    <div className="w-full max-w-md mx-auto">
                      <img
                        src={getImageUrl(selectedMaterial.file)! || "/placeholder.svg"}
                        alt={selectedMaterial.name}
                        className="w-full h-64 object-cover rounded-lg border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML =
                              '<div class="w-full h-64 bg-slate-100 rounded-lg border flex items-center justify-center"><span class="text-slate-500">Image not available</span></div>'
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Detailed Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Package2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Material Name</p>
                        <p className="text-slate-900">{selectedMaterial.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Description</p>
                        <p className="text-slate-900">{selectedMaterial.description || "No description"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Created At</p>
                        <p className="text-slate-900">{formatDateTime(selectedMaterial.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Updated At</p>
                        <p className="text-slate-900">{formatDateTime(selectedMaterial.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Material Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Material ID:</span>
                      <span className="text-blue-900 font-medium">#{selectedMaterial.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Has Description:</span>
                      <span className="text-blue-900 font-medium">{selectedMaterial.description ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Has Image:</span>
                      <span className="text-blue-900 font-medium">{selectedMaterial.file ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">File Path:</span>
                      <span className="text-blue-900 font-medium text-xs break-all">
                        {selectedMaterial.file || "None"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Full Image URL:</span>
                      <span className="text-blue-900 font-medium text-xs break-all">
                        {getImageUrl(selectedMaterial.file) || "None"}
                      </span>
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
              <span>Delete Material</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the material.
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

            {materialToDelete && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {getImageUrl(materialToDelete.file) ? (
                      <img
                        src={getImageUrl(materialToDelete.file)! || "/placeholder.svg"}
                        alt={materialToDelete.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const nextSibling = target.nextElementSibling as HTMLElement
                          if (nextSibling) {
                            nextSibling.classList.remove("hidden")
                          }
                        }}
                      />
                    ) : null}
                    <Package2
                      className={`w-6 h-6 text-slate-400 ${getImageUrl(materialToDelete.file) ? "hidden" : ""}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{materialToDelete.name}</p>
                    <p className="text-sm text-slate-600">{materialToDelete.description}</p>
                    <p className="text-xs text-slate-500">ID: {materialToDelete.id}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Are you sure you want to delete this material?</p>
                      <p className="mt-1">
                        Material "{materialToDelete.name}" will be permanently removed from the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteDialogClose} disabled={isDeletingMaterial}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteMaterial}
              disabled={isDeletingMaterial}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingMaterial ? "Deleting..." : "Delete Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update material information and image</DialogDescription>
          </DialogHeader>

          {isLoadingEditData ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
              <span className="ml-2 text-slate-600">Loading material data...</span>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="edit-name">Material Name *</Label>
                <Input
                  id="edit-name"
                  value={editMaterial.name}
                  onChange={(e) => setEditMaterial({ ...editMaterial, name: e.target.value })}
                  placeholder="Enter material name"
                  disabled={isEditingMaterial}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editMaterial.description}
                  onChange={(e) => setEditMaterial({ ...editMaterial, description: e.target.value })}
                  placeholder="Enter material description (optional)"
                  disabled={isEditingMaterial}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-file">Material Image</Label>
                <div className="space-y-2">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    id="edit-file"
                    accept="image/*"
                    onChange={handleEditFileSelect}
                    disabled={isEditingMaterial}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isEditingMaterial}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {editMaterial.file
                      ? "Change Selected Image"
                      : editImagePreview
                        ? "Change Current Image"
                        : "Upload New Image"}
                  </Button>

                  {/* Show current image or new selected image */}
                  {(editImagePreview || editMaterial.file) && (
                    <div className="relative">
                      <img
                        src={
                          editMaterial.file
                            ? URL.createObjectURL(editMaterial.file)
                            : editImagePreview || "/placeholder.svg"
                        }
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML =
                              '<div class="w-full h-32 bg-slate-100 rounded-lg border flex items-center justify-center"><span class="text-slate-500 text-sm">Image not available</span></div>'
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeEditImage}
                        disabled={isEditingMaterial}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {editMaterial.file && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          New Image Selected
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                    {originalEditImageUrl && !editMaterial.file && (
                      <span className="block mt-1 text-blue-600">
                        Current image will be kept if no new image is selected
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleEditDialogClose} disabled={isEditingMaterial || isLoadingEditData}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMaterial} disabled={isEditingMaterial || isLoadingEditData}>
              {isEditingMaterial ? "Updating..." : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
