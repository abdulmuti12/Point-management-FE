"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Plus, Eye, Edit, Trash2, AlertCircle, Megaphone, ImageIcon, X, Calendar, FileText, Tag, Users, ChevronLeft, ChevronRight, Clock, Building } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Campaign {
  id: number
  name: string
  title: string | null
  title2: string | null
  title3: string | null
  title4: string | null
  title5: string | null
  description: string | null
  note: string | null
  note2: string | null
  note3: string | null
  note4: string | null
  note5: string | null
  status: string
  type: string
  file: string | null
  file2: string | null
  file3: string | null
  file4: string | null
  created_at: string
  updated_at: string
}

interface CampaignDetail {
  id: number
  name: string
  title: string | null
  title2: string | null
  title3: string | null
  title4: string | null
  title5: string | null
  description: string | null
  note: string | null
  note2: string | null
  note3: string | null
  note4: string | null
  note5: string | null
  status: string
  type: string
  file: string | null
  file2: string | null
  file3: string | null
  file4: string | null
  file5: string | null
  file6: string | null
  file7: string | null
  created_at: string
  updated_at: string
}

interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

interface ApiResponse {
  success: boolean
  message: string
  data: {
    data: Campaign[]
  }
  meta: PaginationMeta
}

interface DetailApiResponse {
  success: boolean
  message: string
  data: {
    general: CampaignDetail
  }
  status: number
}

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailedCampaignData, setDetailedCampaignData] = useState<CampaignDetail | null>(null)
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showImageZoom, setShowImageZoom] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    title2: "",
    title3: "",
    title4: "",
    title5: "",
    description: "",
    note: "",
    note2: "",
    note3: "",
    note4: "",
    note5: "",
    status: "Active",
    type: "",
  })
  const [files, setFiles] = useState<{
    file: File | null
    file2: File | null
    file3: File | null
    file4: File | null
    file5: File | null
    file6: File | null
    file7: File | null
  }>({
    file: null,
    file2: null,
    file3: null,
    file4: null,
    file5: null,
    file6: null,
    file7: null,
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    title: "",
    title2: "",
    title3: "",
    title4: "",
    title5: "",
    description: "",
    note: "",
    note2: "",
    note3: "",
    note4: "",
    note5: "",
    status: "Active",
    type: "",
  })
  const [editFiles, setEditFiles] = useState<{
    file: File | null
    file2: File | null
    file3: File | null
    file4: File | null
    file5: File | null
    file6: File | null
    file7: File | null
  }>({
    file: null,
    file2: null,
    file3: null,
    file4: null,
    file5: null,
    file6: null,
    file7: null,
  })
  const [existingFiles, setExistingFiles] = useState<{
    file: string | null
    file2: string | null
    file3: string | null
    file4: string | null
    file5: string | null
    file6: string | null
    file7: string | null
  }>({
    file: null,
    file2: null,
    file3: null,
    file4: null,
    file5: null,
    file6: null,
    file7: null,
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [paginationLoading, setPaginationLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchCampaigns(1)
    }
  }, [mounted])

  // Helper function to safely parse JSON response
  const parseJsonResponse = async (response: Response) => {
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch (error) {
      console.error("Failed to parse JSON response:", text)
      throw new Error(`Server returned invalid response. Status: ${response.status}`)
    }
  }

  const fetchCampaigns = async (page = 1) => {
    if (!mounted) return

    try {
      // Only show main loading for first page, use pagination loading for other pages
      if (page === 1) {
        setLoading(true)
      } else {
        setPaginationLoading(true)
      }
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("[v0] No token found in localStorage")
        setError("Authentication required. Please login again.")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.")
      }

      const response = await fetch(`${apiUrl}/admins/banner?page=${page}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        console.error("[v0] Authentication failed - 401 status received")
        setError("Authentication failed. Your session may have expired.")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await parseJsonResponse(response)

      if (data.success) {
        setCampaigns(data.data.data.data)
        setPaginationMeta(data.data.meta)
        setCurrentPage(data.data.meta.current_page)
      } else {
        setError(data.message || "Failed to fetch campaigns")
      }
    } catch (error) {
      console.error("[v0] Error fetching campaigns:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch campaigns. Please try again.")
    } finally {
      setLoading(false)
      setPaginationLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 1 && paginationMeta && page <= paginationMeta.last_page) {
      fetchCampaigns(page)
    }
  }

  const handleDetail = async (campaign: Campaign) => {
    if (!mounted) return

    setSelectedCampaign(campaign)
    setShowDetailModal(true)
    setDetailLoading(true)
    setDetailError(null)
    setDetailedCampaignData(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("[v0] No token found when fetching campaign details")
        setDetailError("Authentication required. Please login again.")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured")
      }

      const response = await fetch(`${apiUrl}/admins/banner/${campaign.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        console.error("[v0] Authentication failed when fetching campaign details - 401 status")
        setDetailError("Authentication failed. Your session may have expired.")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: DetailApiResponse = await parseJsonResponse(response)

      if (data.success) {
        setDetailedCampaignData(data.data.general)
      } else {
        setDetailError(data.message || "Failed to fetch campaign details")
      }
    } catch (error) {
      console.error("[v0] Error fetching campaign details:", error)
      setDetailError(error instanceof Error ? error.message : "Failed to fetch campaign details. Please try again.")
    } finally {
      setDetailLoading(false)
    }
  }

  const getFileToDisplay = (campaign: Campaign) => {
    return campaign.file || campaign.file2 || campaign.file3 || campaign.file4 || null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "image":
        return "bg-blue-100 text-blue-800"
      case "video":
        return "bg-green-100 text-green-800"
      case "banner":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getImageFiles = (data: CampaignDetail) => {
    const files = []
    if (data.file) files.push(data.file)
    if (data.file2) files.push(data.file2)
    if (data.file3) files.push(data.file3)
    if (data.file4) files.push(data.file4)
    if (data.file5) files.push(data.file5)
    if (data.file6) files.push(data.file6)
    if (data.file7) files.push(data.file7)
    return files.filter((file) => file !== null)
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted) return

    try {
      setCreateLoading(true)
      setCreateError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("[v0] No token found when creating campaign")
        setCreateError("Authentication required. Please login again.")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.")
      }

      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("title", formData.title)
      formDataToSend.append("title2", formData.title2)
      formDataToSend.append("title3", formData.title3)
      formDataToSend.append("title4", formData.title4)
      formDataToSend.append("title5", formData.title5)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("note", formData.note)
      formDataToSend.append("note2", formData.note2)
      formDataToSend.append("note3", formData.note3)
      formDataToSend.append("note4", formData.note4)
      formDataToSend.append("note5", formData.note5)
      formDataToSend.append("status", formData.status)
      formDataToSend.append("type", formData.type)

      // Append files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file)
        }
      })

      console.log("[v0] Creating campaign with URL:", `${apiUrl}/admins/banner`)
      console.log("[v0] Form data:", {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        note: formData.note,
        files: Object.entries(files)
          .filter(([, file]) => file !== null)
          .map(([key]) => key),
      })

      const response = await fetch(`${apiUrl}/admins/banner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.status === 401) {
        console.error("[v0] Authentication failed when creating campaign - 401 status")
        setCreateError("Authentication failed. Your session may have expired.")
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}. ${errorText.substring(0, 200)}`)
      }

      const data = await parseJsonResponse(response)
      console.log("[v0] Response data:", data)

      if (data.success) {
        setCreateSuccess(true)
        setShowCreateModal(false)
        resetForm()
        fetchCampaigns(1) // Refresh the list and go to first page

        // Hide success notification after 3 seconds
        setTimeout(() => {
          setCreateSuccess(false)
        }, 3000)
      } else {
        setCreateError(data.message || "Failed to create campaign")
      }
    } catch (error) {
      console.error("[v0] Error creating campaign:", error)
      setCreateError(error instanceof Error ? error.message : "Failed to create campaign. Please try again.")
    } finally {
      setCreateLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      title2: "",
      title3: "",
      title4: "",
      title5: "",
      description: "",
      note: "",
      note2: "",
      note3: "",
      note4: "",
      note5: "",
      status: "Active",
      type: "",
    })
    setFiles({
      file: null,
      file2: null,
      file3: null,
      file4: null,
      file5: null,
      file6: null,
      file7: null,
    })
    setCreateError(null)
  }

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign)
    setShowDeleteModal(true)
  }

  const handleDeleteCampaign = async () => {
    if (!mounted || !campaignToDelete) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("[v0] No token found when deleting campaign")
        setDeleteError("Authentication required. Please login again.")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured")
      }

      const response = await fetch(`${apiUrl}/admins/banner/${campaignToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        console.error("[v0] Authentication failed when deleting campaign - 401 status")
        setDeleteError("Authentication failed. Your session may have expired.")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await parseJsonResponse(response)

      if (data.success) {
        setDeleteSuccess(true)
        setShowDeleteModal(false)
        setCampaignToDelete(null)
        fetchCampaigns(currentPage) // Refresh current page

        // Hide success notification after 3 seconds
        setTimeout(() => {
          setDeleteSuccess(false)
        }, 3000)
      } else {
        setDeleteError(data.message || "Failed to delete campaign")
        // Hide error notification after 5 seconds
        setTimeout(() => {
          setDeleteError(null)
        }, 5000)
      }
    } catch (error) {
      console.error("[v0] Error deleting campaign:", error)
      setDeleteError(error instanceof Error ? error.message : "Failed to delete campaign. Please try again.")
      // Hide error notification after 5 seconds
      setTimeout(() => {
        setDeleteError(null)
      }, 5000)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditClick = async (campaign: Campaign) => {
    if (!mounted) return

    setCampaignToEdit(campaign)
    setShowEditModal(true)
    setEditLoading(true)
    setEditError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("[v0] No token found when fetching campaign for edit")
        setEditError("Authentication required. Please login again.")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured")
      }

      const response = await fetch(`${apiUrl}/admins/banner-edit/${campaign.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        console.error("[v0] Authentication failed when fetching campaign for edit - 401 status")
        setEditError("Authentication failed. Your session may have expired.")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await parseJsonResponse(response)

      if (data.success) {
        const campaignData = data.data
        setEditFormData({
          name: campaignData.name || "",
          title: campaignData.title || "",
          title2: campaignData.title2 || "",
          title3: campaignData.title3 || "",
          title4: campaignData.title4 || "",
          title5: campaignData.title5 || "",
          description: campaignData.description || "",
          note: campaignData.note || "",
          note2: campaignData.note2 || "",
          note3: campaignData.note3 || "",
          note4: campaignData.note4 || "",
          note5: campaignData.note5 || "",
          status: campaignData.status || "Active",
          type: campaignData.type || "",
        })
        setExistingFiles({
          file: campaignData.file || null,
          file2: campaignData.file2 || null,
          file3: campaignData.file3 || null,
          file4: campaignData.file4 || null,
          file5: campaignData.file5 || null,
          file6: campaignData.file6 || null,
          file7: campaignData.file7 || null,
        })
      } else {
        setEditError(data.message || "Failed to fetch campaign data")
      }
    } catch (error) {
      console.error("[v0] Error fetching campaign for edit:", error)
      setEditError(error instanceof Error ? error.message : "Failed to fetch campaign data. Please try again.")
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted || !campaignToEdit) return

    try {
      setEditLoading(true)
      setEditError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("[v0] No token found when updating campaign")
        setEditError("Authentication required. Please login again.")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured")
      }

      const formDataToSend = new FormData()
      formDataToSend.append("_method", "PUT")
      formDataToSend.append("name", editFormData.name)
      formDataToSend.append("title", editFormData.title)
      formDataToSend.append("title2", editFormData.title2)
      formDataToSend.append("title3", editFormData.title3)
      formDataToSend.append("title4", editFormData.title4)
      formDataToSend.append("title5", editFormData.title5)
      formDataToSend.append("description", editFormData.description)
      formDataToSend.append("note", editFormData.note)
      formDataToSend.append("note2", editFormData.note2)
      formDataToSend.append("note3", editFormData.note3)
      formDataToSend.append("note4", editFormData.note4)
      formDataToSend.append("note5", editFormData.note5)
      formDataToSend.append("status", editFormData.status)
      formDataToSend.append("type", editFormData.type)

      // Append files
      Object.entries(editFiles).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file)
        }
      })

      const response = await fetch(`${apiUrl}/admins/banner/${campaignToEdit.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (response.status === 401) {
        console.error("[v0] Authentication failed when updating campaign - 401 status")
        setEditError("Authentication failed. Your session may have expired.")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await parseJsonResponse(response)

      if (data.success) {
        setEditSuccess(true)
        setShowEditModal(false)
        resetEditForm()
        fetchCampaigns(currentPage) // Refresh current page

        // Hide success notification after 3 seconds
        setTimeout(() => {
          setEditSuccess(false)
        }, 3000)
      } else {
        setEditError(data.message || "Failed to update campaign")
      }
    } catch (error) {
      console.error("[v0] Error updating campaign:", error)
      setEditError(error instanceof Error ? error.message : "Failed to update campaign. Please try again.")
    } finally {
      setEditLoading(false)
    }
  }

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      title: "",
      title2: "",
      title3: "",
      title4: "",
      title5: "",
      description: "",
      note: "",
      note2: "",
      note3: "",
      note4: "",
      note5: "",
      status: "Active",
      type: "",
    })
    setEditFiles({
      file: null,
      file2: null,
      file3: null,
      file4: null,
      file5: null,
      file6: null,
      file7: null,
    })
    setExistingFiles({
      file: null,
      file2: null,
      file3: null,
      file4: null,
      file5: null,
      file6: null,
      file7: null,
    })
    setEditError(null)
    setCampaignToEdit(null)
  }

  const handleEditFileChange = (fileKey: string, file: File | null) => {
    setEditFiles((prev) => ({
      ...prev,
      [fileKey]: file,
    }))
  }

  const handleFileChange = (fileKey: string, file: File | null) => {
    setFiles((prev) => ({
      ...prev,
      [fileKey]: file,
    }))
  }

  // Pagination component
  const renderPagination = () => {
    if (!paginationMeta || paginationMeta.last_page <= 1) return null

    const { current_page, last_page, from, to, total } = paginationMeta
    const maxVisiblePages = 5
    let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(last_page, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>
            Showing {from} to {to} of {total} campaigns
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current_page - 1)}
            disabled={current_page === 1 || paginationLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* First Page */}
          {startPage > 1 && (
            <>
              <Button
                variant={1 === current_page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={paginationLoading}
                className="h-8 w-8 p-0"
              >
                1
              </Button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}

          {/* Page Numbers */}
          {pages.map((page) => (
            <Button
              key={page}
              variant={page === current_page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={paginationLoading}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          ))}

          {/* Last Page */}
          {endPage < last_page && (
            <>
              {endPage < last_page - 1 && <span className="text-gray-400">...</span>}
              <Button
                variant={last_page === current_page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(last_page)}
                disabled={paginationLoading}
                className="h-8 w-8 p-0"
              >
                {last_page}
              </Button>
            </>
          )}

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current_page + 1)}
            disabled={current_page === last_page || paginationLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-blue-600" />
            Campaign Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your marketing campaigns and banners</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Campaign
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {createSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Campaign created successfully!</AlertDescription>
        </Alert>
      )}

      {/* Delete Success Alert */}
      {deleteSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Campaign deleted successfully!</AlertDescription>
        </Alert>
      )}

      {/* Edit Success Alert */}
      {editSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Campaign updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Delete Error Alert */}
      {deleteError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campaigns
          </CardTitle>
          <CardDescription>
            A list of all campaigns in your account including their name, type, and files.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first campaign.</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Campaign
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-6">Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className={paginationLoading ? "opacity-50" : ""}>
                        <TableCell className="font-medium px-6">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Megaphone className="h-4 w-4 text-blue-600" />
                            </div>
                            {campaign.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(campaign.type)}>{campaign.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {getFileToDisplay(campaign) ? (
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 truncate max-w-[150px]">
                                {getFileToDisplay(campaign)?.split("/").pop()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No file</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                            {campaign.description || campaign.note || "No description"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(campaign.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                              onClick={() => handleDetail(campaign)}
                              disabled={paginationLoading}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50"
                              onClick={() => handleEditClick(campaign)}
                              disabled={paginationLoading}
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={() => handleDeleteClick(campaign)}
                              disabled={deleteLoading || paginationLoading}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Campaign Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="flex justify-between items-start p-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Campaign Details</h2>
              <p className="text-gray-600 mt-1 text-sm">Detailed information about the selected campaign.</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowDetailModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : detailError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{detailError}</AlertDescription>
              </Alert>
            ) : detailedCampaignData ? (
              <div className="space-y-6">
                {/* Campaign Images Section */}
                {getImageFiles(detailedCampaignData).length > 0 && (
                  <div className="space-y-3">
                    {/* Main Image Display */}
                    <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                      <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                        <img
                          src={getImageFiles(detailedCampaignData)[selectedImageIndex] || "/placeholder.svg"}
                          alt={`Campaign ${detailedCampaignData.name}`}
                          className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-200"
                          onClick={() => setShowImageZoom(true)}
                        />
                      </div>

                      {/* Image Navigation */}
                      {getImageFiles(detailedCampaignData).length > 1 && (
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black/50 rounded-lg p-1">
                          {getImageFiles(detailedCampaignData).map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`w-10 h-10 rounded overflow-hidden border-2 transition-all ${
                                selectedImageIndex === index
                                  ? "border-white ring-2 ring-white/50"
                                  : "border-white/30 hover:border-white/60"
                              }`}
                            >
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Campaign ${detailedCampaignData.name} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Campaign Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campaign Name */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 mb-1">Campaign Name</h3>
                      <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.name}</p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Tag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 mb-1">Type</h3>
                      <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.type}</p>
                    </div>
                  </div>

                  {/* Note */}
                  {detailedCampaignData.title && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Title</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.title}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.title2 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Title 2</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.title2}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.title3 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Title 3</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.title3}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.title4 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-fuchsia-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-fuchsia-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Title 4</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.title4}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.title5 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Title 5</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.title5}</p>
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {detailedCampaignData.note && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Note</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.note}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.note2 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Note 2</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.note2}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.note3 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Note 3</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.note3}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.note4 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-lime-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Note 4</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.note4}</p>
                      </div>
                    </div>
                  )}

                  {detailedCampaignData.note5 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Note 5</h3>
                        <p className="text-lg font-semibold text-gray-800">{detailedCampaignData.note5}</p>
                      </div>
                    </div>
                  )}

                  {/* Created At */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 mb-1">Created At</h3>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatDate(detailedCampaignData.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Updated At */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 mb-1">Updated At</h3>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatDate(detailedCampaignData.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Tag className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 mb-1">Status</h3>
                      <Badge
                        className={
                          detailedCampaignData.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {detailedCampaignData.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 mb-1">Description</h3>
                      <p className="text-lg font-semibold text-gray-800">
                        {detailedCampaignData.description || "No description available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedCampaign ? (
              <div className="text-center py-8">
                <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No detailed data available</h3>
                <p className="text-gray-600">Basic campaign information is shown below.</p>
                <div className="mt-4 text-left">
                  <p>
                    <strong>Name:</strong> {selectedCampaign.name}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedCampaign.type}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedCampaign.description || "No description"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Close Button */}
          <div className="flex justify-end p-4 border-t bg-gray-50">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              Create New Campaign
            </DialogTitle>
            <DialogDescription>Add a new campaign to your marketing collection.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-6">
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter campaign name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter campaign description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title2">Title 2</Label>
              <Input
                id="title2"
                type="text"
                placeholder="Enter title 2"
                value={formData.title2}
                onChange={(e) => setFormData((prev) => ({ ...prev, title2: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title3">Title 3</Label>
              <Input
                id="title3"
                type="text"
                placeholder="Enter title 3"
                value={formData.title3}
                onChange={(e) => setFormData((prev) => ({ ...prev, title3: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title4">Title 4</Label>
              <Input
                id="title4"
                type="text"
                placeholder="Enter title 4"
                value={formData.title4}
                onChange={(e) => setFormData((prev) => ({ ...prev, title4: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title5">Title 5</Label>
              <Input
                id="title5"
                type="text"
                placeholder="Enter title 5"
                value={formData.title5}
                onChange={(e) => setFormData((prev) => ({ ...prev, title5: e.target.value }))}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter additional notes"
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note2">Note 2</Label>
              <Textarea
                id="note2"
                placeholder="Enter additional notes"
                value={formData.note2}
                onChange={(e) => setFormData((prev) => ({ ...prev, note2: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note3">Note 3</Label>
              <Textarea
                id="note3"
                placeholder="Enter additional notes"
                value={formData.note3}
                onChange={(e) => setFormData((prev) => ({ ...prev, note3: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note4">Note 4</Label>
              <Textarea
                id="note4"
                placeholder="Enter additional notes"
                value={formData.note4}
                onChange={(e) => setFormData((prev) => ({ ...prev, note4: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note5">Note 5</Label>
              <Textarea
                id="note5"
                placeholder="Enter additional notes"
                value={formData.note5}
                onChange={(e) => setFormData((prev) => ({ ...prev, note5: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Non Active">Non Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Campaign Files</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} className="space-y-2">
                    <Label htmlFor={`file${num === 1 ? "" : num}`}>
                      File {num} {num <= 4 && "*"}
                    </Label>
                    <Input
                      id={`file${num === 1 ? "" : num}`}
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        handleFileChange(num === 1 ? "file" : `file${num}`, file)
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {files[num === 1 ? "file" : (`file${num}` as keyof typeof files)] && (
                      <p className="text-sm text-green-600">
                        ✓ {files[num === 1 ? "file" : (`file${num}` as keyof typeof files)]?.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createLoading || !formData.name || !formData.type}
              >
                {createLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md p-0">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600">Delete Campaign</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setShowDeleteModal(false)
                setCampaignToDelete(null)
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-4">
            {/* Warning Text */}
            <p className="text-gray-600">This action cannot be undone. This will permanently delete the campaign.</p>

            {/* Campaign Info Card */}
            {campaignToDelete && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Megaphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{campaignToDelete.name}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {campaignToDelete.description || campaignToDelete.note || "No description"}
                    </p>
                    <p className="text-xs text-gray-500">ID: {campaignToDelete.id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Are you sure you want to delete this campaign?</p>
                  <p className="text-sm text-red-700 mt-1">
                    Campaign "{campaignToDelete?.name}" will be permanently removed from the system.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setCampaignToDelete(null)
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCampaign}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Campaign"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Edit Campaign
            </DialogTitle>
            <DialogDescription>Update the campaign information and files.</DialogDescription>
          </DialogHeader>

          {editLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Loading campaign data...</span>
            </div>
          ) : (
            <form onSubmit={handleEditCampaign} className="space-y-6">
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Campaign Name *</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder="Enter campaign name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(value) => setEditFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter campaign description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  type="text"
                  placeholder="Enter title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title2">Title 2</Label>
                <Input
                  id="edit-title2"
                  type="text"
                  placeholder="Enter title 2"
                  value={editFormData.title2}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, title2: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title3">Title 3</Label>
                <Input
                  id="edit-title3"
                  type="text"
                  placeholder="Enter title 3"
                  value={editFormData.title3}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, title3: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title4">Title 4</Label>
                <Input
                  id="edit-title4"
                  type="text"
                  placeholder="Enter title 4"
                  value={editFormData.title4}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, title4: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title5">Title 5</Label>
                <Input
                  id="edit-title5"
                  type="text"
                  placeholder="Enter title 5"
                  value={editFormData.title5}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, title5: e.target.value }))}
                />
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="edit-note">Note</Label>
                <Textarea
                  id="edit-note"
                  placeholder="Enter additional notes"
                  value={editFormData.note}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note2">Note 2</Label>
                <Textarea
                  id="edit-note2"
                  placeholder="Enter additional notes"
                  value={editFormData.note2}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, note2: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note3">Note 3</Label>
                <Textarea
                  id="edit-note3"
                  placeholder="Enter additional notes"
                  value={editFormData.note3}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, note3: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note4">Note 4</Label>
                <Textarea
                  id="edit-note4"
                  placeholder="Enter additional notes"
                  value={editFormData.note4}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, note4: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note5">Note 5</Label>
                <Textarea
                  id="edit-note5"
                  placeholder="Enter additional notes"
                  value={editFormData.note5}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, note5: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Non Active">Non Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Campaign Files</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const fileKey = num === 1 ? "file" : `file${num}`
                    const existingFile = existingFiles[fileKey as keyof typeof existingFiles]
                    const newFile = editFiles[fileKey as keyof typeof editFiles]

                    return (
                      <div key={num} className="space-y-2">
                        <Label htmlFor={`edit-file${num === 1 ? "" : num}`}>
                          File {num} {num <= 4 && "*"}
                        </Label>

                        {/* Show existing file if available */}
                        {existingFile && !newFile && (
                          <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-sm text-gray-600 truncate">Current: {existingFile.split("/").pop()}</p>
                          </div>
                        )}

                        <Input
                          id={`edit-file${num === 1 ? "" : num}`}
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            handleEditFileChange(fileKey, file)
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />

                        {newFile && <p className="text-sm text-green-600">✓ New file: {newFile.name}</p>}

                        {existingFile && !newFile && (
                          <p className="text-xs text-gray-500">Leave empty to keep current file</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    resetEditForm()
                  }}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={editLoading || !editFormData.name || !editFormData.type}
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Campaign
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Modal */}
      {showImageZoom && (
        <Dialog open={showImageZoom} onOpenChange={setShowImageZoom}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-black/90">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setShowImageZoom(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {detailedCampaignData && getImageFiles(detailedCampaignData).length > 0 && (
                <>
                  <img
                    src={getImageFiles(detailedCampaignData)[selectedImageIndex] || "/placeholder.svg"}
                    alt={`Campaign ${detailedCampaignData.name} - Zoomed`}
                    className="max-w-full max-h-full object-contain"
                  />

                  {getImageFiles(detailedCampaignData).length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === 0 ? getImageFiles(detailedCampaignData).length - 1 : prev - 1,
                          )
                        }
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === getImageFiles(detailedCampaignData).length - 1 ? 0 : prev + 1,
                          )
                        }
                      >
                        <ChevronRight className="h-8 w-8" />
                      </Button>
                    </>
                  )}

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                    {selectedImageIndex + 1} / {getImageFiles(detailedCampaignData).length}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
