"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Briefcase,
  Building,
  Globe,
} from "lucide-react"

interface CustomerData {
  id: number
  name: string
  full_name: string
  email: string
  phone_number: string
  status: string
  verify: number
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
    data: CustomerData[]
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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
const ADMINS_API_BASE_URL = `${API_URL}/admins`

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("all") // all, name, email, phone_number

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailedCustomerData, setDetailedCustomerData] = useState<any>(null)

  const [editStatus, setEditStatus] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const fetchCustomers = async (page = 1, search = "") => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        // router.push("/login")
        // return
      }

      // Build URL with search parameters
      let url = `${ADMINS_API_BASE_URL}/customer?page=${page}`

      if (search.trim()) {
        // Add search parameter based on search type
        if (searchType === "all") {
          url += `&search=${encodeURIComponent(search.trim())}`
        } else {
          url += `&${searchType}=${encodeURIComponent(search.trim())}`
        }
      }

      console.log("Fetching customers from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      console.log("Response status:", response.status)

      if (response.status === 401 || response.status === 400) {
        localStorage.removeItem("token")
        router.push("/login")
        return
      }
      if (!response.ok) {
        setError(`HTTP error! status: ${response.status}`)
        return
      }

      const responseData: ApiResponse = await response.json()
      console.log("Response data:", responseData)

      if (!responseData.success) {
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (responseData.data && Array.isArray(responseData.data.data)) {
        setCustomers(responseData.data.data)
        setCurrentPage(responseData.data.current_page ?? 1)
        setTotalPages(responseData.data.last_page ?? 1)
        setTotalItems(responseData.data.total ?? 0)
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setCustomers(responseData.data as unknown as CustomerData[])
      } else {
        setCustomers([])
        setCurrentPage(1)
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
      // On network error (CORS, server down, etc.) clear token and redirect
      // localStorage.removeItem("token")
      // router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  // Debounced search function
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
      fetchCustomers(1, query)
    }, 500) // 500ms delay

    setSearchTimeout(timeout)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchCustomers(1, "")
  }

  const handleDetail = async (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
    setDetailLoading(true)
    setDetailError(null)
    setDetailedCustomerData(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        // router.push("/login")
        // return
      }

      const response = await fetch(`${ADMINS_API_BASE_URL}/customer/${customer.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      const responseData = await response.json()
      console.log("Customer detail response:", responseData)

      if (response.status === 401) {
        localStorage.removeItem("token")
        // router.push("/login")
        // return
      }

      if (responseData.success) {
        setDetailedCustomerData(responseData.data)
      } else {
        setDetailError(responseData.message || "Failed to fetch customer details")
      }
    } catch (error) {
      console.error("Error fetching customer details:", error)
      setDetailError("An error occurred while fetching customer details")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleEdit = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setEditStatus(customer.status)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return

    try {
      setEditLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch(`${ADMINS_API_BASE_URL}/customer/${selectedCustomer.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: editStatus,
        }),
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        setShowEditModal(false)
        setSelectedCustomer(null)
        fetchCustomers(currentPage, searchQuery) // Refresh the list
      } else {
        console.error("Failed to update customer:", responseData.message)
        alert(responseData.message || "Failed to update customer")
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      alert("An error occurred while updating customer")
    } finally {
      setEditLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1)

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchCustomers(page, searchQuery)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "active") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    } else if (statusLower === "inactive") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
    } else {
      return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleRetry = () => {
    fetchCustomers(currentPage, searchQuery)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Customers</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={handleRetry} className="inline-flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
            <p className="text-slate-600">Manage and view customer information</p>
          </div>
        </div>
      </div>

      {/* Stats Card - Smaller and positioned on the left */}
      <div className="flex justify-start">
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Customers</p>
                <p className="text-xl font-bold text-slate-900">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customers List</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">Search by:</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="phone_number">Phone Number</option>
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search by ${searchType === "all" ? "name, email, or phone" : searchType}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-64 pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No customers found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verify</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.full_name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone_number}</TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell>{customer.verify ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDetail(customer)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems}{" "}
                    customers
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Customer Details</h3>
                  <p className="text-sm text-slate-600">Detailed information about the selected customer</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetailModal(false)
                  setDetailError(null)
                  setDetailLoading(false)
                  setDetailedCustomerData(null)
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Loading customer details...</span>
              </div>
            ) : detailError ? (
              <div className="py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-600 mb-2">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Error Loading Details</span>
                  </div>
                  <p className="text-sm text-red-600">{detailError}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {detailedCustomerData.general?.full_name ||
                        detailedCustomerData.full_name ||
                        detailedCustomerData.name ||
                        selectedCustomer.name}
                    </h3>
                    <p className="text-slate-600">
                      {detailedCustomerData.general?.email || detailedCustomerData.email || selectedCustomer.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusBadge(
                        detailedCustomerData.general?.status || detailedCustomerData.status || selectedCustomer.status,
                      )}
                    </div>
                  </div>
                </div>

                {/* General Information Section */}
                {detailedCustomerData.general && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Users className="w-5 h-5 text-blue-600 mr-2" />
                      General Information
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(detailedCustomerData.general)
                        .filter(([key]) => key.toLowerCase() !== "id") // Add this filter to remove ID field
                        .map(([key, value]) => {
                          // Get appropriate icon for each field
                          const getFieldIcon = (fieldKey: string) => {
                            const iconMap: { [key: string]: any } = {
                              id: Users,
                              name: Users,
                              full_name: Users,
                              email: Mail,
                              phone_number: Phone,
                              phone: Phone,
                              address: MapPin,
                              alamat: MapPin,
                              city: MapPin,
                              kota: MapPin,
                              country: Globe,
                              negara: Globe,
                              created_at: Calendar,
                              updated_at: Calendar,
                              birth_date: Calendar,
                              tanggal_lahir: Calendar,
                              gender: Users,
                              jenis_kelamin: Users,
                              status: Shield,
                              age: Users,
                              umur: Users,
                              postal_code: MapPin,
                              kode_pos: MapPin,
                              province: MapPin,
                              provinsi: MapPin,
                              occupation: Briefcase,
                              pekerjaan: Briefcase,
                              company: Building,
                              perusahaan: Building,
                            }
                            return iconMap[fieldKey.toLowerCase()] || Users
                          }

                          const IconComponent = getFieldIcon(key)
                          const displayValue =
                            typeof value === "object" && value !== null
                              ? JSON.stringify(value, null, 2)
                              : String(value || "N/A")

                          return (
                            <div
                              key={key}
                              className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg"
                            >
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <IconComponent className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 capitalize">
                                  {key.replace(/_/g, " ")}
                                </p>
                                <p className="text-sm text-slate-900 break-words mt-1">{displayValue}</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Other Data Sections */}
                {Object.entries(detailedCustomerData)
                  .filter(([key]) => key !== "general")
                  .map(([sectionKey, sectionData]) => (
                    <div key={sectionKey} className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                        {sectionKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h4>
                      {typeof sectionData === "object" && sectionData !== null ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {Object.entries(sectionData).map(([key, value]) => {
                            const getFieldIcon = (fieldKey: string) => {
                              const iconMap: { [key: string]: any } = {
                                id: Users,
                                name: Users,
                                full_name: Users,
                                email: Mail,
                                phone_number: Phone,
                                phone: Phone,
                                address: MapPin,
                                alamat: MapPin,
                                city: MapPin,
                                kota: MapPin,
                                country: Globe,
                                negara: Globe,
                                created_at: Calendar,
                                updated_at: Calendar,
                                birth_date: Calendar,
                                tanggal_lahir: Calendar,
                                gender: Users,
                                jenis_kelamin: Users,
                                status: Shield,
                                age: Users,
                                umur: Users,
                                postal_code: MapPin,
                                kode_pos: MapPin,
                                province: MapPin,
                                provinsi: MapPin,
                                occupation: Briefcase,
                                pekerjaan: Briefcase,
                                company: Building,
                                perusahaan: Building,
                              }
                              return iconMap[fieldKey.toLowerCase()] || Users
                            }
                            const IconComponent = getFieldIcon(key)
                            const displayValue =
                              typeof value === "object" && value !== null
                                ? JSON.stringify(value, null, 2)
                                : String(value || "N/A")

                            return (
                              <div
                                key={key}
                                className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <IconComponent className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 capitalize">
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-sm text-slate-900 break-words mt-1">{displayValue}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-3 border border-slate-200 rounded-lg">
                          <p className="text-sm text-slate-900">{String(sectionData || "N/A")}</p>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Additional Info Section */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Customer Summary</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Customer ID:</span>
                      <span className="text-blue-900 font-medium">
                        #{detailedCustomerData.general?.id || detailedCustomerData.id || selectedCustomer.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Account Status:</span>
                      <span className="text-blue-900 font-medium">
                        {detailedCustomerData.general?.status || detailedCustomerData.status || selectedCustomer.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Contact Email:</span>
                      <span className="text-blue-900 font-medium">
                        {detailedCustomerData.general?.email || detailedCustomerData.email || selectedCustomer.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
              <Button
                onClick={() => {
                  setShowDetailModal(false)
                  setDetailError(null)
                  setDetailLoading(false)
                  setDetailedCustomerData(null)
                }}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Edit Customer Status</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name:</label>
                <input
                  type="text"
                  value={selectedCustomer.name}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name:</label>
                <input
                  type="text"
                  value={selectedCustomer.full_name}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email:</label>
                <input
                  type="email"
                  value={selectedCustomer.email}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone Number:</label>
                <input
                  type="text"
                  value={selectedCustomer.phone_number}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button onClick={() => setShowEditModal(false)} variant="outline" disabled={editLoading}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
