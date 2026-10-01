"use client"

import { useState, useEffect } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Mail,
  Phone,
  User,
  MessageSquare,
  Calendar,
  Eye,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

// Define API base URL using environment variables
const API_BASE_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/admins`

interface ContactUs {
  id: number
  name: string
  email: string
  phone_number: string | null
  description: string | null
  created_at: string
  updated_at: string
}

interface Meta {
  current_page: number
  from: number
  last_page: number
  links: {
    url: string | null
    label: string
    active: boolean
  }[]
  path: string
  per_page: number
  to: number
  total: number
}

interface ContactUsResponse {
  success: boolean
  message: string
  data: {
    data: {
      data: ContactUs[]
    }
    meta: Meta
    links: {
      first: string
      last: string
      prev: string | null
      next: string | null
    }
  }
  status: number
}

const Loading = () => null;

export default function ContactUsPage() {
  const [contacts, setContacts] = useState<ContactUs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalContacts, setTotalContacts] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const searchParams = useSearchParams()

  const [searchName, setSearchName] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [searchPhone, setSearchPhone] = useState("")

  const [selectedContact, setSelectedContact] = useState<ContactUs | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<ContactUs | null>(null)

  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: "success" | "error"
  }>({
    show: false,
    message: "",
    type: "success",
  })

  // Fetch contacts
  const fetchContacts = async (page = 1, name = "") => {
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

      let url = `${API_BASE_URL}/contact-us?page=${page}`
      if (name) url += `&name=${encodeURIComponent(name)}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data: ContactUsResponse = await response.json()

      if (data.success) {
        setContacts(data.data.data.data)
        setCurrentPage(data.data.meta.current_page)
        setTotalPages(data.data.meta.last_page)
        setTotalContacts(data.data.meta.total)
      } else {
        setError(data.message || "Failed to fetch contact data")
        setContacts([])
      }
    } catch (err) {
      setError("Failed to fetch contact data. Please try again.")
      setContacts([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchContacts(currentPage)
  }, [currentPage])

  // Handle search
  const handleSearch = () => {
    setIsSearching(true)
    setCurrentPage(1)
    fetchContacts(1, searchTerm)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
    setCurrentPage(1)
    fetchContacts(1)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Format date
  const formatDate = (dateString?: string) => {
  if (!dateString) return "-"

  const date = new Date(dateString.replace(" ", "T"))
  if (isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

  // View contact details
  const viewContactDetails = async (contact: ContactUs) => {
    setSelectedContact(null)
    setDetailError(null)
    setDetailDialogOpen(true)
    setDetailLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setDetailError("Authentication required. Please login.")
        setDetailLoading(false)
        return
      }

      const url = `${API_BASE_URL}/contact-us/${contact.id}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        setDetailError(errorData.message || `Failed to load contact details (${response.status})`)
        setDetailLoading(false)
        return
      }

      const data = await response.json()

    console.log("DETAIL RESPONSE:", data)

     if (data.success && data.data && data.data.general) {
        setSelectedContact(data.data.general)
      } else {
        setDetailError(data.message || "Failed to load product details")
      }
    } catch (err) {
      console.error("Error fetching contact us details:", err)
      setDetailError("Failed to fetch contact us details. Please try again.")
    } finally {
      setDetailLoading(false)
    }
    }
  // Delete contact
  const deleteContact = async () => {
    if (!contactToDelete) return

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

      const response = await fetch(`${API_BASE_URL}/contact-us/${contactToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setDeleteDialogOpen(false)
        setContactToDelete(null)
        setNotification({
          show: true,
          message: "Contact deleted successfully!",
          type: "success",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)

        fetchContacts(currentPage)
      } else {
        setNotification({
          show: true,
          message: data.message || "Failed to delete contact",
          type: "error",
        })
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }))
        }, 3000)
      }
    } catch (err) {
      setNotification({
        show: true,
        message: "Failed to delete contact. Please try again.",
        type: "error",
      })
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }))
      }, 3000)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteClick = (contact: ContactUs) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

 return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
          <p className="text-muted-foreground">Manage customer contact inquiries</p>
        </div>
       </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

     {/* Search and Table */}
    <div className="space-y-4">
       <div className="bg-white p-4 rounded-lg shadow-sm border">
       <div className="flex flex-col md:flex-row gap-4">

    {/* Search Name */}
    <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name contacts..."
          className="pl-8"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {searchName && (
          <button
            onClick={() => setSearchName("")}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Email */}
      <div className="relative flex-1">
        <Input
          placeholder="Filter by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {searchEmail && (
          <button
            onClick={() => setSearchEmail("")}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Phone */}
      <div className="relative flex-1">
        <Input
          placeholder="Filter by phone..."
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {searchPhone && (
          <button
            onClick={() => setSearchPhone("")}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Button */}
      <Button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Search
          </>
        )}
      </Button>

      {/* Clear */}
      {(searchName || searchEmail || searchPhone) && (
        <Button variant="outline" onClick={clearSearch}>
          Clear
        </Button>
      )}

    </div>
  </div>
</div>
      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Messages ({totalContacts})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No contacts found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Name
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                      </TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="text-sm">{contact.email}</TableCell>
                        <TableCell className="text-sm">
                          {contact.phone_number || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewContactDetails(contact)}
                              title="View details"
                            >

                             <Eye className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(contact)}
                              title="Delete contact"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalContacts)} of {totalContacts}{" "}
                  contacts
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        const diff = Math.abs(page - currentPage)
                        return diff === 0 || diff === 1 || page === 1 || page === totalPages
                      })
                      .map((page, index, arr) => {
                        if (index > 0 && arr[index - 1] !== page - 1) {
                          return <span key={`ellipsis-${page}`}>...</span>
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
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
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>View full contact information</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailError ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          ) : selectedContact ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Personal Information</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedContact.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedContact.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedContact.phone_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created Date</p>
                    <p className="font-medium">{formatDate(selectedContact.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <h3 className="font-semibold">Message</h3>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {selectedContact.description || "No message provided"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No contact selected</div>
          )}

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
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {contactToDelete && (
            <div className="space-y-4 rounded-lg bg-muted p-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{contactToDelete.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{contactToDelete.email}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteContact}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 rounded-lg border-l-4 bg-white p-4 shadow-lg" style={{
          borderLeftColor: notification.type === "success" ? "#10b981" : "#ef4444",
        }}>
          <p className="font-medium" style={{
            color: notification.type === "success" ? "#10b981" : "#ef4444",
          }}>
            {notification.message}
          </p>
        </div>
      )}
    </div>
  )
}
