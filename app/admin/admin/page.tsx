"use client"

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Mail,
  User,
  Crown,
  Activity,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminData {
  id: number
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  updated_at: string
  password?: string // Add optional password field
  role_id?: string // Add optional role_id field
}

interface AdminDetailData {
  general: {
    id: number
    name: string
    email: string
    role: string
    status: string
    last_login: string | null
    created_at: string
    updated_at: string
  }
}

interface RoleData {
  id: number
  name: string
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
    data: AdminData[]
    current_page: number
    from: number
    last_page: number
    links: PaginationLink[]
    path: string
    per_page: number
    to: number
    total: number
    first_page_url: string
    last_page_url: string
    prev_page_url: string | null
    next_page_url: string | null
  }
  status: number
}

interface DetailApiResponse {
  success: boolean
  message: string
  data: AdminDetailData
  status: number
}

interface RoleApiResponse {
  success: boolean
  message: string
  data: RoleData[]
  status: number
}

interface CreateAdminResponse {
  success: boolean
  message: string
  data?: any
  status: number
}

interface ToastNotification {
  id: string
  type: "success" | "error"
  title: string
  message: string
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<AdminData[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [searchType, setSearchType] = useState<"name" | "email">("name")
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null)
  const [adminDetail, setAdminDetail] = useState<AdminDetailData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [roleError, setRoleError] = useState("")
  const [createMessage, setCreateMessage] = useState("")
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    status: "Active",
  })
  const router = useRouter()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<AdminData | null>(null)

  const [isEditingAdmin, setIsEditingAdmin] = useState(false)
  const [editMessage, setEditMessage] = useState("")

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

  // Fetch admins data from API
  const fetchAdmins = async (page = 1, type: "name" | "email" = "name", value = "") => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      setIsSearching(true)

      const params = new URLSearchParams()
      if (page > 1) params.append("page", page.toString())
      if (value.trim()) {
        params.append(type, value.trim())
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admins/admin${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data: ApiResponse = await response.json()

      if (response.ok && data.success) {
        setAdmins(data.data.data)
        setCurrentPage(data.data.current_page)
        setTotalPages(data.data.last_page)
        setTotalItems(data.data.total)
      } else {
        // If API returns success: false, redirect to login
        localStorage.removeItem("token")
        router.push("/login")
      }
    } catch (error) {
      console.error("Admin API error:", error)
      // On network error, redirect to login
      localStorage.removeItem("token")
      router.push("/login")
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Fetch roles data from API
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      setIsLoadingRoles(true)
      setRoleError("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/get-role`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data: RoleApiResponse = await response.json()

      if (response.ok && data.success) {
        setRoles(data.data)
      } else {
        setRoleError(data.message || "Failed to load roles")
      }
    } catch (error) {
      console.error("Roles API error:", error)
      setRoleError("Network error occurred while loading roles")
    } finally {
      setIsLoadingRoles(false)
    }
  }

  // Fetch admin detail
  const fetchAdminDetail = async (adminId: number) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      setIsLoadingDetail(true)
      setDetailError("")
      setAdminDetail(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/admin/${adminId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data: DetailApiResponse = await response.json()

      if (response.ok && data.success) {
        setAdminDetail(data.data)
      } else {
        setDetailError(data.message || "Failed to load admin details")
      }
    } catch (error) {
      console.error("Admin detail API error:", error)
      setDetailError("Network error occurred while loading admin details")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Create new admin
  const createAdmin = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setCreateMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsCreatingAdmin(true)
      setCreateMessage("")

      // Debug: Log the request details
      console.log("Creating admin with token:", token ? "Token exists" : "No token")
      console.log("Request payload:", {
        name: newAdmin.name,
        email: newAdmin.email,
        status: newAdmin.status,
        password: newAdmin.password,
        role_id: Number.parseInt(newAdmin.role_id),
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/admin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          status: newAdmin.status,
          password: newAdmin.password,
          role_id: Number.parseInt(newAdmin.role_id),
        }),
      })

      // Debug: Log response details
      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      const data: CreateAdminResponse = await response.json()
      console.log("Response data:", data)

      if (response.status === 401) {
        setCreateMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        setCreateMessage("Admin created successfully!")
        // Reset form
        setNewAdmin({
          name: "",
          email: "",
          password: "",
          role_id: "",
          status: "Active",
        })
        // Refresh admin list
        fetchAdmins(currentPage, searchType, searchValue)
        // Close dialog after a short delay
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 2000)
      } else {
        setCreateMessage(data.message || `Failed to create admin (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Create admin API error:", error)
      setCreateMessage("Network error occurred while creating admin")
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  // Handle view detail
  const handleViewDetail = (admin: AdminData) => {
    setSelectedAdmin(admin)
    setIsDetailDialogOpen(true)
    fetchAdminDetail(admin.id)
  }

  // Handle add dialog open
  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (open) {
      fetchRoles() // Fetch roles when opening add dialog
      setCreateMessage("")
    } else {
      // Reset form when closing
      setNewAdmin({
        name: "",
        email: "",
        password: "",
        role_id: "",
        status: "Active",
      })
      setCreateMessage("")
    }
  }

  // Initial load
  useEffect(() => {
    fetchAdmins()
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchAdmins(1, searchType, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue, searchType])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchAdmins(page, searchType, searchValue)
  }

  // Handle search type change
  const handleSearchTypeChange = (type: "name" | "email") => {
    setSearchType(type)
    setSearchValue("") // Clear search value when changing type
    setCurrentPage(1)
    fetchAdmins(1, type, "")
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchAdmins(1, searchType, "")
  }

  // Statistics based on current data
  const stats = [
    {
      title: "Total Admins",
      value: totalItems.toString(),
      description: "All admin users",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Admins",
      value: admins.filter((admin) => admin.status === "Active").length.toString(),
      description: "Currently active",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Super Admins",
      value: admins.filter((admin) => admin.role === "Super Admin").length.toString(),
      description: "Highest privileges",
      icon: Shield,
      color: "text-purple-600",
    },
  ]

  const handleAddAdmin = () => {
    if (newAdmin.name && newAdmin.email && newAdmin.password && newAdmin.role_id) {
      createAdmin()
    } else {
      setCreateMessage("Please fill in all required fields")
    }
  }

  // Update admin
  const updateAdmin = async (adminId: number) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsEditingAdmin(true)
      setEditMessage("")

      if (!selectedAdmin) {
        setEditMessage("No admin selected for editing")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/admin/${adminId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: selectedAdmin.name,
          email: selectedAdmin.email,
          status: selectedAdmin.status,
          password: selectedAdmin.password || "password", // Default password if not provided
          role_id: Number.parseInt(selectedAdmin.role_id || "1"),
        }),
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
        addToast("success", "Admin Updated", `Admin "${selectedAdmin.name}" has been successfully updated.`)
        // Refresh admin list
        fetchAdmins(currentPage, searchType, searchValue)
        // Close dialog after a short delay
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setSelectedAdmin(null)
          setEditMessage("")
        }, 1000)
      } else {
        setEditMessage(data.message || `Failed to update admin (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Update admin API error:", error)
      setEditMessage("Network error occurred while updating admin")
    } finally {
      setIsEditingAdmin(false)
    }
  }

  const handleEditAdmin = () => {
    if (selectedAdmin && selectedAdmin.name && selectedAdmin.email && selectedAdmin.role_id) {
      updateAdmin(selectedAdmin.id)
    } else {
      setEditMessage("Please fill in all required fields")
    }
  }

  // Delete admin
  const deleteAdmin = async (adminId: number, adminName: string) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/admin/${adminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (response.ok && data.success) {
        // Show success toast
        addToast("success", "Admin Deleted", `Admin "${adminName}" has been successfully deleted.`)
        // Refresh admin list after successful deletion
        fetchAdmins(currentPage, searchType, searchValue)
      } else {
        // Show error toast
        addToast("error", "Delete Failed", data.message || "Failed to delete admin. Please try again.")
      }
    } catch (error) {
      console.error("Delete admin API error:", error)
      // Show error toast for network errors
      addToast("error", "Network Error", "A network error occurred while deleting the admin. Please try again.")
    }
  }

  const handleDeleteAdmin = (admin: AdminData) => {
    setAdminToDelete(admin)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAdmin = () => {
    if (adminToDelete) {
      deleteAdmin(adminToDelete.id, adminToDelete.name)
      setIsDeleteDialogOpen(false)
      setAdminToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Inactive
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      "Super Admin": "bg-purple-100 text-purple-800",
      Admin: "bg-blue-100 text-blue-800",
      Moderator: "bg-orange-100 text-orange-800",
      Editor: "bg-green-100 text-green-800",
    }
    return (
      <Badge
        className={`${colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"} hover:${colors[role as keyof typeof colors] || "bg-gray-100"}`}
      >
        {role}
      </Badge>
    )
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

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never"
    return new Date(lastLogin).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
            <p className="text-slate-600 mt-2">Loading admin data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
          <p className="text-slate-600 mt-2">Manage admin users and their permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>Create a new admin user account</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Enter name"
                  disabled={isCreatingAdmin}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="Enter email address"
                  disabled={isCreatingAdmin}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Enter password"
                  disabled={isCreatingAdmin}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                {isLoadingRoles ? (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                    <span className="text-sm text-slate-600">Loading roles...</span>
                  </div>
                ) : roleError ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{roleError}</AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={newAdmin.role_id}
                    onValueChange={(value) => setNewAdmin({ ...newAdmin, role_id: value })}
                    disabled={isCreatingAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={newAdmin.status}
                  onValueChange={(value) => setNewAdmin({ ...newAdmin, status: value })}
                  disabled={isCreatingAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingAdmin}>
                Cancel
              </Button>
              <Button onClick={handleAddAdmin} disabled={isCreatingAdmin}>
                {isCreatingAdmin ? "Creating..." : "Create Admin"}
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

      {/* Search and Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-900">Admin Users</CardTitle>
              <CardDescription>
                Showing {admins.length} of {totalItems} admin accounts
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Type Selector */}
              <Select value={searchType} onValueChange={handleSearchTypeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={`Search by ${searchType}...`}
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
              Searching for "{searchValue}" in {searchType} field
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length > 0 ? (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>{getStatusBadge(admin.status)}</TableCell>
                    <TableCell className="text-slate-600">{formatLastLogin(admin.last_login)}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(admin.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(admin)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // Fetch roles first if not already loaded
                            if (roles.length === 0) {
                              await fetchRoles()
                            }

                            // Find the role_id based on the current role name
                            const currentRole = roles.find((role) => role.name === admin.role)

                            setSelectedAdmin({
                              ...admin,
                              password: "", // Add password field
                              role_id: currentRole ? currentRole.id.toString() : "", // Map role name to role_id
                            })
                            setIsEditDialogOpen(true)
                            setEditMessage("")
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {searchValue
                      ? `No admins found matching "${searchValue}" in ${searchType} field.`
                      : "No admin data available."}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span>Admin Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected admin user</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                <span className="ml-3 text-slate-600">Loading admin details...</span>
              </div>
            ) : detailError ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{detailError}</AlertDescription>
              </Alert>
            ) : adminDetail ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{adminDetail.general.name}</h3>
                    <p className="text-slate-600">{adminDetail.general.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getRoleBadge(adminDetail.general.role)}
                      {getStatusBadge(adminDetail.general.status)}
                    </div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Email Address</p>
                        <p className="text-slate-900">{adminDetail.general.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Crown className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Role</p>
                        <p className="text-slate-900">{adminDetail.general.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Status</p>
                        <p className="text-slate-900">{adminDetail.general.status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Last Login</p>
                        <p className="text-slate-900">{formatLastLogin(adminDetail.general.last_login)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Created At</p>
                        <p className="text-slate-900">{formatDateTime(adminDetail.general.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Updated At</p>
                        <p className="text-slate-900">{formatDateTime(adminDetail.general.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Admin Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Admin ID:</span>
                      <span className="text-blue-900 font-medium">#{adminDetail.general.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Account Type:</span>
                      <span className="text-blue-900 font-medium">{adminDetail.general.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Account Status:</span>
                      <span className="text-blue-900 font-medium">{adminDetail.general.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setSelectedAdmin(null)
            setEditMessage("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update admin user information</DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
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
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={selectedAdmin.name}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, name: e.target.value })}
                  placeholder="Enter name"
                  disabled={isEditingAdmin}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedAdmin.email}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, email: e.target.value })}
                  placeholder="Enter email address"
                  disabled={isEditingAdmin}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-password">Password *</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={selectedAdmin.password || ""}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, password: e.target.value })}
                  placeholder="Enter new password"
                  disabled={isEditingAdmin}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role *</Label>
                {isLoadingRoles ? (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                    <span className="text-sm text-slate-600">Loading roles...</span>
                  </div>
                ) : roleError ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{roleError}</AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={selectedAdmin.role_id || ""}
                    onValueChange={(value) => setSelectedAdmin({ ...selectedAdmin, role_id: value })}
                    disabled={isEditingAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={selectedAdmin.status}
                  onValueChange={(value) => setSelectedAdmin({ ...selectedAdmin, status: value })}
                  disabled={isEditingAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedAdmin(null)
                setEditMessage("")
              }}
              disabled={isEditingAdmin}
            >
              Cancel
            </Button>
            <Button onClick={handleEditAdmin} disabled={isEditingAdmin}>
              {isEditingAdmin ? "Updating..." : "Update Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>Delete Admin</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the admin account.
            </DialogDescription>
          </DialogHeader>

          {adminToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">{adminToDelete.name}</p>
                    <p className="text-sm text-red-700">{adminToDelete.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(adminToDelete.role)}
                      {getStatusBadge(adminToDelete.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Deleting this admin will remove all associated data and cannot be recovered.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setAdminToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAdmin} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
