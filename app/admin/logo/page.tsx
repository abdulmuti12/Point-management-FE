"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

const API_ROOT_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
const API_BASE_URL = `${API_ROOT_URL}/admins`
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL
  ? `${process.env.NEXT_PUBLIC_STORAGE_URL.replace(/\/$/, "")}/`
  : API_ROOT_URL
    ? `${API_ROOT_URL.replace(/\/api$/, "")}/storage/`
    : "http://127.0.0.1:8000/storage/"

interface Logo {
  id?: number
  description: string
  image: string
  is_active?: boolean | number
}

interface Meta {
  current_page: number
  from: number
  last_page: number
  path: string
  per_page: number
  to: number
  total: number
}

interface LogoResponse {
  success: boolean
  message: string
  data: {
    data: {
      data: Logo[]
    }
    meta: Meta
  }
  status: number
}

export default function LogoPage() {
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: "success" | "error"
  }>({
    show: false,
    message: "",
    type: "success",
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [logoToDelete, setLogoToDelete] = useState<Logo | null>(null)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: "",
    description: "",
  })
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string>("")
  const [currentLogoImage, setCurrentLogoImage] = useState<string>("")

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({
      show: true,
      message,
      type,
    })
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

  // Get image URL helper
  const getImageUrl = useCallback(
    (filePath: string | null): string => {
      if (!filePath) {
        return "/placeholder.svg?height=100&width=100"
      }
      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath
      }
      return `${STORAGE_BASE_URL}${filePath}`
    },
    [STORAGE_BASE_URL],
  )

  // Fetch logos
  const fetchLogos = async (page = 1, description = "") => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Authentication required. Please login.")
        setLoading(false)
        setIsSearching(false)
        return
      }

      let url = `${API_BASE_URL}/logo?page=${page}`
      if (description) url += `&description=${encodeURIComponent(description)}`

       const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data: LogoResponse = await response.json()

      if (data.success) {
        setLogos(data.data.data.data)
        setCurrentPage(data.data.meta.current_page)
        setTotalPages(data.data.meta.last_page)
      } else {
        setError(data.message || "Failed to fetch logos")
        setLogos([])
      }
    } catch (err) {
      setError("Failed to fetch logos. Please try again.")
      setLogos([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchLogos(currentPage)
  }, [currentPage])

  // Handle search
  const handleSearch = () => {
    setIsSearching(true)
    setCurrentPage(1)
    fetchLogos(1, searchTerm)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
    setCurrentPage(1)
    fetchLogos(1)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // View logo details
  const viewLogoDetails = async (logo: Logo) => {
    setSelectedLogo(logo)
    setDetailDialogOpen(true)
  }

  // Create logo
  const createLogo = async () => {
    if (!formData.description || !imageFile) {
      setNotification({
        show: true,
        message: "Please fill in all fields",
        type: "error",
      })
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }))
      }, 3000)
      return
    }

    setCreateLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setNotification({
          show: true,
          message: "Authentication required. Please login.",
          type: "error",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)
        setCreateLoading(false)
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("description", formData.description)
      formDataToSend.append("image", imageFile)

      const response = await fetch(`${API_BASE_URL}/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success) {
        setCreateDialogOpen(false)
        setNotification({
          show: true,
          message: data.message || "Logo created successfully!",
          type: "success",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)

        setFormData({
          description: "",
        })
        setImageFile(null)
        setImagePreview("")
        setLogos((prev) =>
          prev.map((logo) => ({
            ...logo,
            is_active: logo.id === data.data?.id ? 1 : 0,
          })),
        )
        fetchLogos(currentPage)
      } else {
        setNotification({
          show: true,
          message: data.message || "Failed to create logo",
          type: "error",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)
      }
    } catch (err) {
      setNotification({
        show: true,
        message: "Failed to create logo. Please try again.",
        type: "error",
      })
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }))
      }, 3000)
    } finally {
      setCreateLoading(false)
    }
  }

  // Delete logo
  const deleteLogo = async () => {
    if (!logoToDelete) return

    setDeleteLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setNotification({
          show: true,
          message: "Authentication required. Please login.",
          type: "error",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)
        setDeleteLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/logo/${logoToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setDeleteDialogOpen(false)
        setLogoToDelete(null)
        setNotification({
          show: true,
          message: data.message || "Logo deleted successfully!",
          type: "success",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)

        fetchLogos(currentPage)
      } else {
        setNotification({
          show: true,
          message: data.message || "Failed to delete logo",
          type: "error",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)
      }
    } catch (err) {
      setNotification({
        show: true,
        message: "Failed to delete logo. Please try again.",
        type: "error",
      })
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }))
      }, 3000)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteClick = (logo: Logo) => {
    setLogoToDelete(logo)
    setDeleteDialogOpen(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview("")
    }
  }

  const handleEditClick = (logo: Logo) => {
    setEditFormData({
      id: logo.id?.toString() || "",
      description: logo.description || "",
    })
    setCurrentLogoImage(logo.image || "")
    setEditImageFile(null)
    setEditImagePreview("")
    setEditDialogOpen(true)
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEditImageChange = (file: File | null) => {
    setEditImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setEditImagePreview("")
    }
  }

  const updateLogo = async () => {
    if (!editFormData.id) {
      showNotification("Logo data is not valid", "error")
      return
    }

    if (!editFormData.description.trim()) {
      showNotification("Description is required", "error")
      return
    }

    setEditLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        showNotification("Authentication required. Please login.", "error")
        setEditLoading(false)
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("_method", "PUT")
      formDataToSend.append("description", editFormData.description)

      if (editImageFile) {
        formDataToSend.append("image", editImageFile)
      }

      const response = await fetch(`${API_BASE_URL}/logo/${editFormData.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success) {
        setEditDialogOpen(false)
        showNotification(data.message || "Logo updated successfully!", "success")
        setEditFormData({
          id: "",
          description: "",
        })
        setEditImageFile(null)
        setEditImagePreview("")
        setCurrentLogoImage("")
        setLogos((prev) =>
          prev.map((logo) => ({
            ...logo,
            is_active: logo.id?.toString() === editFormData.id ? 1 : 0,
          })),
        )
        fetchLogos(currentPage)
      } else {
        showNotification(data.message || "Failed to update logo", "error")
      }
    } catch (err) {
      showNotification("Failed to update logo. Please try again.", "error")
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logo Management</h1>
          <p className="text-sm text-muted-foreground">Manage your company logos</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Logo
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search Logos</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
          {searchTerm && (
            <Button variant="outline" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Logos Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logos.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">No logos found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logos.map((logo, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <img
                          src={getImageUrl(logo.image)}
                          alt={logo.description}
                          className="h-12 w-12 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewLogoDetails(logo)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(logo)}
                            className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(logo)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && logos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Logo Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Logo</DialogTitle>
            <DialogDescription>Create a new logo entry with description and image</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter logo description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Logo Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent/50">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="image" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="h-24 w-24 mx-auto object-contain" />
                      <p className="text-xs text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button onClick={createLogo} disabled={createLoading} className="gap-2">
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Logo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Logo Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Logo</DialogTitle>
            <DialogDescription>Update logo information and make it the active login logo</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Enter logo description"
                value={editFormData.description}
                onChange={(e) => handleEditInputChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Logo Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent/50">
                <input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditImageChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="edit-image" className="cursor-pointer">
                  {editImagePreview ? (
                    <div className="space-y-2">
                      <img src={editImagePreview} alt="Preview" className="h-24 w-24 mx-auto object-contain" />
                      <p className="text-xs text-muted-foreground">New image selected</p>
                    </div>
                  ) : currentLogoImage ? (
                    <div className="space-y-2">
                      <img
                        src={getImageUrl(currentLogoImage)}
                        alt="Current logo"
                        className="h-24 w-24 mx-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={updateLogo} disabled={editLoading} className="gap-2">
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Logo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Logo Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Logo Details</DialogTitle>
          </DialogHeader>

          {selectedLogo && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <img
                  src={getImageUrl(selectedLogo.image)}
                  alt={selectedLogo.description}
                  className="max-h-64 max-w-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-base font-medium">{selectedLogo.description}</p>
              </div>
            </div>
          )}

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Logo</DialogTitle>
            <DialogDescription>Are you sure you want to delete this logo? This action cannot be undone.</DialogDescription>
          </DialogHeader>

          {logoToDelete && (
            <div className="flex gap-4 py-4">
              <img
                src={getImageUrl(logoToDelete.image)}
                alt={logoToDelete.description}
                className="h-16 w-16 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
              <div>
                <p className="font-medium">{logoToDelete.description}</p>
                <p className="text-sm text-muted-foreground">ID: {logoToDelete.id}</p>
              </div>
            </div>
          )}

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteLogo}
              disabled={deleteLoading}
              className="gap-2"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm rounded-lg p-4 text-white shadow-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}
