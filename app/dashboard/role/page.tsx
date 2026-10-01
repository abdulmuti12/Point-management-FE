"use client"

import { DialogTrigger } from "@/components/ui/dialog"

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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Crown,
  CheckCircle,
  XCircle,
  X,
  Settings,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RoleData {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface RoleDetailData {
  general: {
    id: number
    name: string
    created_at: string
    updated_at: string
    menu: {
      menu: Array<{
        id: number
        name: string
        route: string
      }>
    }
    description?: string
    permissions?: string[]
  }
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface ApiResponse {
  data: {
    data: RoleData[]
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

interface DetailApiResponse {
  success: boolean
  message: string
  data: RoleDetailData
  status: number
}

interface CreateRoleResponse {
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

interface MenuItem {
  id: number
  name: string
}

export default function RolePage() {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null)
  const [roleDetail, setRoleDetail] = useState<RoleDetailData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [createMessage, setCreateMessage] = useState("")
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [newRole, setNewRole] = useState({
    name: "",
  })
  const [apiError, setApiError] = useState("")
  const router = useRouter()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null)

  const [isEditingRole, setIsEditingRole] = useState(false)
  const [editMessage, setEditMessage] = useState("")

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedMenus, setSelectedMenus] = useState<number[]>([])
  const [isLoadingMenus, setIsLoadingMenus] = useState(false)
  const [menuError, setMenuError] = useState("")

  const [editRoleData, setEditRoleData] = useState<{
    name: string
    menus: Array<{
      id: number
      name: string
      selected: boolean
    }>
  }>({ name: "", menus: [] })
  const [selectedEditMenus, setSelectedEditMenus] = useState<number[]>([])
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)

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

  // Fetch roles data from API
  const fetchRoles = async (page = 1, value = "") => {
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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admins/role${params.toString() ? `?${params.toString()}` : ""}`

      console.log("Fetching roles from:", url)
      console.log("Using token:", token ? "Token exists" : "No token")

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

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
        setRoles([])
        return
      }

      if (response.ok) {
        // Check if response has success field and it's false
        if (responseData.success === false) {
          setApiError(responseData.message || "API returned success: false")
          addToast("error", "Error", responseData.message || "Failed to fetch roles")
          setRoles([])
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(0)
          return
        }

        // Extract data from the correct structure
        if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
          const rolesList = responseData.data.data
          setRoles(rolesList)
          setCurrentPage(responseData.meta.current_page)
          setTotalPages(responseData.meta.last_page)
          setTotalItems(responseData.meta.total)
          console.log("Roles loaded successfully:", rolesList.length, "roles")
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // Fallback: if data is directly an array
          setRoles(responseData.data)
          setCurrentPage(1)
          setTotalPages(1)
          setTotalItems(responseData.data.length)
          console.log("Roles loaded (fallback):", responseData.data.length, "roles")
        } else {
          console.error("Unexpected API response structure:", responseData)
          setApiError(
            `Unexpected data format from server. Expected array of roles but got: ${typeof responseData.data}`,
          )
          setRoles([])
        }
      } else {
        // Handle error response
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`
        setApiError(errorMessage)
        addToast("error", "API Error", errorMessage)
        setRoles([])
        console.error("API Error:", errorMessage)
      }
    } catch (error) {
      console.error("Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setApiError(`Network error: ${errorMessage}`)
      addToast("error", "Network Error", "Failed to connect to server. Please check your connection.")
      setRoles([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Fetch role detail
  const fetchRoleDetail = async (roleId: number) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      setIsLoadingDetail(true)
      setDetailError("")
      setRoleDetail(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/role/${roleId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Only redirect to login if we get a 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      const data = await response.json()

      if (response.ok && data.success) {
        setRoleDetail(data.data)
      } else {
        setDetailError(data.message || "Failed to load role details")
      }
    } catch (error) {
      console.error("Role detail API error:", error)
      setDetailError("Network error occurred while loading role details")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Create new role
  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setMenuError("Authentication token not found. Please login again.")
        return
      }

      setIsLoadingMenus(true)
      setMenuError("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/get-menu`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        setMenuError("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      const data = await response.json()

      if (response.ok && data.success) {
        setMenuItems(data.data)
      } else {
        setMenuError(data.message || "Failed to load menu items")
      }
    } catch (error) {
      console.error("Menu items API error:", error)
      setMenuError("Network error occurred while loading menu items")
    } finally {
      setIsLoadingMenus(false)
    }
  }

  const createRole = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setCreateMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsCreatingRole(true)
      setCreateMessage("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/role`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: newRole.name,
          menus: selectedMenus, // Include selected menus
        }),
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
        addToast("success", "Role Created", `Role "${newRole.name}" has been successfully created.`)

        // Reset form
        setNewRole({
          name: "",
        })
        setSelectedMenus([])

        // Refresh role list
        fetchRoles(currentPage, searchValue)

        // Close dialog after a short delay
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setCreateMessage("")
        }, 2000)
      } else {
        setCreateMessage(data.message || `Failed to create role (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Create role API error:", error)
      setCreateMessage("Network error occurred while creating role")
    } finally {
      setIsCreatingRole(false)
    }
  }

  // Handle view detail
  const handleViewDetail = (role: RoleData) => {
    setSelectedRole(role)
    setIsDetailDialogOpen(true)
    fetchRoleDetail(role.id)
  }

  // Handle add dialog open
  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (open) {
      fetchMenuItems() // Fetch menu items when opening add dialog
      setCreateMessage("")
      setSelectedMenus([]) // Reset selected menus
    } else {
      // Reset form when closing
      setNewRole({
        name: "",
      })
      setSelectedMenus([])
      setCreateMessage("")
    }
  }

  // Initial load
  useEffect(() => {
    // Add a small delay to ensure the component is mounted
    const timer = setTimeout(() => {
      fetchRoles()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchRoles(1, searchValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchRoles(page, searchValue)
  }

  // Handle search value change
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("")
    setCurrentPage(1)
    fetchRoles(1, "")
  }

  // Statistics based on current data
  const stats = [
    {
      title: "Total Roles",
      value: totalItems.toString(),
      description: "All system roles",
      icon: Shield,
      color: "text-purple-600",
    },
    {
      title: "Active Roles",
      value: roles.length.toString(),
      description: "Currently active",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Admin Roles",
      value: roles.filter((role) => role.name.toLowerCase().includes("admin")).length.toString(),
      description: "Administrative roles",
      icon: Crown,
      color: "text-blue-600",
    },
  ]

  // Add a function to handle menu checkbox changes
  const handleMenuCheckboxChange = (menuId: number) => {
    setSelectedMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId)
      } else {
        return [...prev, menuId]
      }
    })
  }

  const handleAddRole = () => {
    if (!newRole.name) {
      setCreateMessage("Please fill in the role name")
      return
    }

    if (selectedMenus.length === 0) {
      setCreateMessage("Please select at least one menu")
      return
    }

    createRole()
  }

  // Update role
  const fetchRoleForEdit = async (roleId: number) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsLoadingEditData(true)
      setEditMessage("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/get-edit-role/${roleId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        setEditMessage("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      const data = await response.json()

      if (response.ok && data.success) {
        setEditRoleData(data.data)

        // Set selected menus based on the response
        const initialSelectedMenus = data.data.menus.filter((menu) => menu.selected).map((menu) => menu.id)

        setSelectedEditMenus(initialSelectedMenus)
      } else {
        setEditMessage(data.message || `Failed to load role data (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Fetch role for edit API error:", error)
      setEditMessage("Network error occurred while loading role data")
    } finally {
      setIsLoadingEditData(false)
    }
  }

  // Add this function to handle menu checkbox changes in edit mode:
  const handleEditMenuCheckboxChange = (menuId: number) => {
    setSelectedEditMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId)
      } else {
        return [...prev, menuId]
      }
    })
  }

  const updateRole = async (roleId: number) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setEditMessage("Authentication token not found. Please login again.")
        router.push("/login")
        return
      }

      setIsEditingRole(true)
      setEditMessage("")

      if (!selectedRole) {
        setEditMessage("No role selected for editing")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/role/${roleId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: editRoleData.name,
          menus: selectedEditMenus,
          _method: "PUT",
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
        addToast("success", "Role Updated", "Update Role Success")
        // Refresh role list
        fetchRoles(currentPage, searchValue)
        // Close dialog after a short delay
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setSelectedRole(null)
          setEditMessage("")
          setEditRoleData({ name: "", menus: [] })
          setSelectedEditMenus([])
        }, 1000)
      } else {
        setEditMessage(data.message || `Failed to update role (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("Update role API error:", error)
      setEditMessage("Network error occurred while updating role")
    } finally {
      setIsEditingRole(false)
    }
  }

  const handleEditRole = () => {
    if (selectedRole && editRoleData.name) {
      updateRole(selectedRole.id)
    } else {
      setEditMessage("Please fill in the role name")
    }
  }

  // Delete role
  const deleteRole = async (roleId: number, roleName: string) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins/role/${roleId}`, {
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
        addToast("success", "Role Deleted", `Role "${roleName}" has been successfully deleted.`)
        // Refresh role list after successful deletion
        fetchRoles(currentPage, searchValue)
      } else {
        // Show error toast
        addToast("error", "Delete Failed", data.message || "Failed to delete role. Please try again.")
      }
    } catch (error) {
      console.error("Delete role API error:", error)
      // Show error toast for network errors
      addToast("error", "Network Error", "A network error occurred while deleting the role. Please try again.")
    }
  }

  const handleDeleteRole = (role: RoleData) => {
    setRoleToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      deleteRole(roleToDelete.id, roleToDelete.name)
      setIsDeleteDialogOpen(false)
      setRoleToDelete(null)
    }
  }

  const getRoleBadge = (roleName: string) => {
    const colors = {
      "Super Admin": "bg-purple-100 text-purple-800",
      Admin: "bg-blue-100 text-blue-800",
      Moderator: "bg-orange-100 text-orange-800",
      Editor: "bg-green-100 text-green-800",
      User: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge
        className={`${colors[roleName as keyof typeof colors] || "bg-slate-100 text-slate-800"} hover:${colors[roleName as keyof typeof colors] || "bg-slate-100"}`}
      >
        {roleName}
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

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
            <p className="text-slate-600 mt-2">Loading role data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-600 mt-2">Manage system roles and permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>Create a new system role</DialogDescription>
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
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                  disabled={isCreatingRole}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="menus">Menu Access *</Label>
                {isLoadingMenus ? (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                    <span className="text-sm text-slate-600">Loading menu items...</span>
                  </div>
                ) : menuError ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{menuError}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                    {menuItems.length > 0 ? (
                      menuItems.map((menu) => (
                        <div key={menu.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`menu-${menu.id}`}
                            checked={selectedMenus.includes(menu.id)}
                            onChange={() => handleMenuCheckboxChange(menu.id)}
                            disabled={isCreatingRole}
                            className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                          />
                          <label htmlFor={`menu-${menu.id}`} className="text-sm font-medium text-slate-700">
                            {menu.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No menu items available</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-500">Select which menus this role can access</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddDialogOpen(false)} disabled={isCreatingRole}>
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={isCreatingRole}>
                {isCreatingRole ? "Creating..." : "Create Role"}
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
              <div className="font-medium">Error loading roles:</div>
              <div className="text-sm">{apiError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApiError("")
                  fetchRoles(currentPage, searchValue)
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
              <CardTitle className="text-slate-900">System Roles</CardTitle>
              <CardDescription>
                Showing {roles.length} of {totalItems} roles
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search roles by name..."
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
              Searching for role name "{searchValue}"
              {totalItems > 0 && ` - Found ${totalItems} result${totalItems > 1 ? "s" : ""}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">{getRoleBadge(role.name)}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(role.created_at)}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(role.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(role)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role)
                            setIsEditDialogOpen(true)
                            setEditMessage("")
                            fetchRoleForEdit(role.id) // Add this line to fetch role data for editing
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
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
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    {searchValue ? `No roles found with name matching "${searchValue}".` : "No role data available."}
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
              <span>Role Details</span>
            </DialogTitle>
            <DialogDescription>Detailed information about the selected role</DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                <span className="ml-3 text-slate-600">Loading role details...</span>
              </div>
            ) : detailError ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{detailError}</AlertDescription>
              </Alert>
            ) : roleDetail ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{roleDetail.general.name}</h3>
                    <p className="text-slate-600">{roleDetail.general.description || "No description"}</p>
                    <div className="flex items-center space-x-2 mt-2">{getRoleBadge(roleDetail.general.name)}</div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Crown className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Role Name</p>
                        <p className="text-slate-900">{roleDetail.general.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Description</p>
                        <p className="text-slate-900">{roleDetail.general.description || "No description"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Created At</p>
                        <p className="text-slate-900">{formatDateTime(roleDetail.general.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Updated At</p>
                        <p className="text-slate-900">{formatDateTime(roleDetail.general.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Menus Section */}
                {roleDetail.general.menu && roleDetail.general.menu.menu && roleDetail.general.menu.menu.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">
                      Assigned Menus ({roleDetail.general.menu.menu.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <div className="grid gap-2 md:grid-cols-1">
                        {roleDetail.general.menu.menu.map((menu) => (
                          <div
                            key={menu.id}
                            className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Settings className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-900 truncate">{menu.name}</p>
                              <p className="text-xs text-blue-700 truncate">Route: /{menu.route}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {roleDetail.general.menu.menu.length} menu{roleDetail.general.menu.menu.length !== 1 ? "s" : ""}{" "}
                      assigned to this role
                    </p>
                  </div>
                )}

                {/* No Menus Message */}
                {roleDetail.general.menu &&
                  (!roleDetail.general.menu.menu || roleDetail.general.menu.menu.length === 0) && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">No menus assigned to this role.</p>
                    </div>
                  )}

                {/* Additional Info */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Role Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Role ID:</span>
                      <span className="text-purple-900 font-medium">#{roleDetail.general.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Role Type:</span>
                      <span className="text-purple-900 font-medium">{roleDetail.general.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Assigned Menus:</span>
                      <span className="text-purple-900 font-medium">
                        {roleDetail.general.menu && roleDetail.general.menu.menu
                          ? roleDetail.general.menu.menu.length
                          : 0}{" "}
                        menu
                        {roleDetail.general.menu &&
                        roleDetail.general.menu.menu &&
                        roleDetail.general.menu.menu.length !== 1
                          ? "s"
                          : ""}
                      </span>
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
            setSelectedRole(null)
            setEditMessage("")
            setEditRoleData({ name: "", menus: [] })
            setSelectedEditMenus([])
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information and permissions</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              {editMessage && (
                <Alert
                  className={
                    editMessage.includes("success") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription className={editMessage.includes("success") ? "text-green-800" : "text-red-800"}>
                    {editMessage}
                  </AlertDescription>
                </Alert>
              )}

              {isLoadingEditData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  <span className="ml-3 text-slate-600">Loading role data...</span>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Role Name *</Label>
                    <Input
                      id="edit-name"
                      value={editRoleData.name}
                      onChange={(e) => setEditRoleData({ ...editRoleData, name: e.target.value })}
                      placeholder="Enter role name"
                      disabled={isEditingRole}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-menus">Menu Access *</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                      {editRoleData.menus && editRoleData.menus.length > 0 ? (
                        editRoleData.menus.map((menu) => (
                          <div key={menu.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`edit-menu-${menu.id}`}
                              checked={selectedEditMenus.includes(menu.id)}
                              onChange={() => handleEditMenuCheckboxChange(menu.id)}
                              disabled={isEditingRole}
                              className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                            />
                            <label htmlFor={`edit-menu-${menu.id}`} className="text-sm font-medium text-slate-700">
                              {menu.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No menu items available</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Select which menus this role can access</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedRole(null)
                setEditMessage("")
                setEditRoleData({ name: "", menus: [] })
                setSelectedEditMenus([])
              }}
              disabled={isEditingRole || isLoadingEditData}
            >
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={isEditingRole || isLoadingEditData}>
              {isEditingRole ? "Updating..." : "Update Role"}
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
              <span>Delete Role</span>
            </DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the role.</DialogDescription>
          </DialogHeader>

          {roleToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">{roleToDelete.name}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Deleting this role will affect all users assigned to this role.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setRoleToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRole} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
