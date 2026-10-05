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
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Check,
  X,
  Upload,
  ImagePlus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"

type MemberLevel = {
  id: string
  name: string
  min_point: number
  max_point: number | null
  file: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function MemberLevelPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [levels, setLevels] = useState<MemberLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [meta, setMeta] = useState<any>(null)

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<MemberLevel | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [minPoint, setMinPoint] = useState<number | "">("")
  const [maxPoint, setMaxPoint] = useState<number | "">("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")
  const [file, setFile] = useState<File | null>(null)

  // Edit form states
  const [editName, setEditName] = useState("")
  const [editMinPoint, setEditMinPoint] = useState<number | "">("")
  const [editMaxPoint, setEditMaxPoint] = useState<number | "">("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState("active")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null)

  const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/admins/member_level`

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      console.error("No auth token found in localStorage!")
      toast({
        title: "Error",
        description: "Session habis, mohon login ulang.",
        variant: "destructive",
      })
      router.push("/login")
      return {}
    }
    return { Authorization: `Bearer ${token}`, Accept: "application/json" }
  }

  // Fetch levels
  const fetchLevels = async (page = currentPage, search = searchTerm, status = statusFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.append("name", search)
      if (status && status !== "all") params.append("status", status)

      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      if (data.success) {
        setLevels(data.data.data)
        setMeta(data.data.meta)
        setTotalPages(data.data.meta.last_page)
        setCurrentPage(data.data.meta.current_page)
      } else {
        throw new Error(data.message || "Failed to fetch")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data Member Level",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLevels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLevels(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLevels(newPage)
    }
  }

  // Reset create form
  const resetCreateForm = () => {
    setName("")
    setMinPoint("")
    setMaxPoint("")
    setDescription("")
    setStatus("active")
    setFile(null)
    setImagePreview(null)
  }

  // Reset edit form
  const resetEditForm = () => {
    setEditName("")
    setEditMinPoint("")
    setEditMaxPoint("")
    setEditDescription("")
    setEditStatus("active")
    setEditFile(null)
    setEditImagePreview(null)
    setExistingFilePath(null)
  }

  // Handle file upload for create
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setImagePreview(URL.createObjectURL(selectedFile))
    }
  }

  // Handle file upload for edit
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setEditFile(selectedFile)
      setEditImagePreview(URL.createObjectURL(selectedFile))
    }
  }

  // Create Member Level
  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Nama Member Level wajib diisi", variant: "destructive" })
      return
    }
    if (minPoint === "" || minPoint === null) {
      toast({ title: "Error", description: "Minimum Point wajib diisi", variant: "destructive" })
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      toast({ title: "Error", description: "Token autentikasi tidak ditemukan", variant: "destructive" })
      router.push("/login")
      return
    }

    setSubmitLoading(true)
    const formData = new FormData()
    formData.append("name", name)
    formData.append("min_point", String(minPoint))
    if (maxPoint !== "" && maxPoint !== null && maxPoint !== undefined) {
      formData.append("max_point", String(maxPoint))
    }
    if (description !== "") {
      formData.append("description", description)
    }
    formData.append("status", status)
    if (file) {
      formData.append("file", file)
    }

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        body: formData,
        headers: getHeaders(),
      })
      console.log("Create response status:", res.status)
      const data = await res.json()
      console.log("Create response data:", data)
      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.data.message || "Member Level berhasil ditambahkan",
        })
        setIsCreateOpen(false)
        resetCreateForm()
        fetchLevels(currentPage)
      } else {
        toast({
          title: "Gagal",
          description: data.message || data.errors?.file?.[0] || "Gagal menambahkan Member Level",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menambahkan Member Level",
        variant: "destructive",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  // Open Edit Modal
  const handleEdit = (level: MemberLevel) => {
    setSelectedLevel(level)
    setEditName(level.name)
    setEditMinPoint(level.min_point)
    setEditMaxPoint(level.max_point || "")
    setEditDescription(level.description || "")
    setEditStatus(level.status)
    setEditFile(null)
    setEditImagePreview(level.file ? `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/storage/${level.file}` : null)
    setExistingFilePath(level.file)
    setIsEditOpen(true)
  }

  // View Member Level
  const handleView = (level: MemberLevel) => {
    setSelectedLevel(level)
    setIsViewOpen(true)
  }

  // Update Member Level
  const handleUpdate = async () => {
    if (!selectedLevel) return
    if (!editName.trim()) {
      toast({ title: "Error", description: "Nama Member Level wajib diisi", variant: "destructive" })
      return
    }
    if (editMinPoint === "" || editMinPoint === null) {
      toast({ title: "Error", description: "Minimum Point wajib diisi", variant: "destructive" })
      return
    }

    setSubmitLoading(true)
    const formData = new FormData()
    formData.append("_method", "PUT")
    formData.append("name", editName)
    formData.append("min_point", String(editMinPoint))
    if (editMaxPoint !== "" && editMaxPoint !== null) {
      formData.append("max_point", String(editMaxPoint))
    }
    formData.append("description", editDescription)
    formData.append("status", editStatus)
    if (editFile) {
      formData.append("file", editFile)
    }

    try {
      const res = await fetch(`${API_BASE}/${selectedLevel.id}`, {
        method: "POST",
        body: formData,
        headers: { ...getHeaders(), Accept: "application/json" },
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: "Session Expired", description: "Mohon login ulang", variant: "destructive" })
          router.push("/login")
          return
        }
        throw new Error("Update failed")
      }
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.data.message || "Member Level berhasil diupdate",
        })
        setIsEditOpen(false)
        resetEditForm()
        fetchLevels(currentPage)
      } else {
        toast({
          title: "Gagal",
          description: data.message || data.errors?.file?.[0] || "Gagal mengupdate Member Level",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate Member Level",
        variant: "destructive",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  // Delete Member Level
  const handleDelete = async () => {
    if (!selectedLevel) return

    setSubmitLoading(true)
    try {
      const res = await fetch(`${API_BASE}/${selectedLevel.id}`, {
        method: "DELETE",
        headers: { ...getHeaders(), Accept: "application/json" },
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: "Session Expired", description: "Mohon login ulang", variant: "destructive" })
          router.push("/login")
          return
        }
        throw new Error("Delete failed")
      }
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.data.message || "Member Level berhasil dihapus",
        })
        setIsDeleteConfirmOpen(false)
        setSelectedLevel(null)
        fetchLevels(currentPage)
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Gagal menghapus Member Level",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus Member Level",
        variant: "destructive",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Nonaktif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getImageUrl = (filePath: string | null) => {
    if (!filePath) return null
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/storage/${filePath}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Member Level</h1>
          <p className="text-muted-foreground mt-1">Kelola level membership dan batas poin</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (open) { resetCreateForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Tambah Member Level
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Member Level</DialogTitle>
              <DialogDescription>
                Tambahkan level membership baru dengan batas poin dan informasi lainnya.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nama Level <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Contoh: Gold, Platinum, Diamond"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="minPoint" className="text-sm font-medium">
                    Minimum Point <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="minPoint"
                    type="number"
                    placeholder="0"
                    value={minPoint}
                    onChange={(e) => setMinPoint(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="maxPoint" className="text-sm font-medium">
                    Maksimum Point
                  </label>
                  <Input
                    id="maxPoint"
                    type="number"
                    placeholder="Kosongkan jika unlimited"
                    value={maxPoint}
                    onChange={(e) => setMaxPoint(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Deskripsi</label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Deskripsi level membership"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="file" className="text-sm font-medium">Gambar/Logo Level</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative size-20 rounded-lg overflow-hidden border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 size-5 rounded-full"
                        onClick={() => { setImagePreview(null); setFile(null) }}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="size-20 rounded-lg border-2 border-dashed flex items-center justify-center">
                      <ImagePlus className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, max 5MB</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={submitLoading}>
                {submitLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama level..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Gambar</TableHead>
                      <TableHead>Nama Level</TableHead>
                      <TableHead className="text-center">Min Point</TableHead>
                      <TableHead className="text-center">Max Point</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Belum ada data Member Level
                        </TableCell>
                      </TableRow>
                    ) : (
                      levels.map((level, idx) => (
                        <TableRow key={level.id}>
                          <TableCell className="font-medium">{idx + 1 + (currentPage - 1) * (meta?.per_page || 10)}</TableCell>
                          <TableCell>
                            {level.file ? (
                              <div className="size-10 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                                <Image
                                  src={getImageUrl(level.file) || ""}
                                  alt={level.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="size-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <ImagePlus className="size-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{level.name}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{level.min_point}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {level.max_point !== null ? (
                              <Badge variant="outline">{level.max_point}</Badge>
                            ) : (
                              <Badge variant="outline" className="opacity-50">∞</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(level.status)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleView(level)} title="Detail">
                                <Eye className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(level)} title="Edit">
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedLevel(level); setIsDeleteConfirmOpen(true) }}
                                title="Hapus"
                                className="hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {meta.from} - {meta.to} dari {meta.total} data
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm">
                      Halaman {meta.current_page} dari {meta.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= meta.last_page}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Member Level</DialogTitle>
            <DialogDescription>Informasi lengkap Member Level.</DialogDescription>
          </DialogHeader>
          {selectedLevel && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedLevel.file ? (
                  <div className="size-32 rounded-xl overflow-hidden border shadow-sm">
                    <Image
                      src={getImageUrl(selectedLevel.file) || ""}
                      alt={selectedLevel.name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                ) : (
                  <div className="size-32 rounded-xl bg-muted flex items-center justify-center border">
                    <ImagePlus className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Level</label>
                  <p className="font-medium">{selectedLevel.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div>{getStatusBadge(selectedLevel.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Minimum Point</label>
                  <p className="font-medium">{selectedLevel.min_point.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Maksimum Point</label>
                  <p className="font-medium">{selectedLevel.max_point !== null ? selectedLevel.max_point.toLocaleString() : "Unlimited"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Deskripsi</label>
                <p className="text-sm whitespace-pre-wrap mt-1">
                  {selectedLevel.description || "-"}
                </p>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Dibuat: {new Date(selectedLevel.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p>Diupdate: {new Date(selectedLevel.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { resetEditForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member Level</DialogTitle>
            <DialogDescription>Ubah informasi Member Level.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="editName" className="text-sm font-medium">
                Nama Level <span className="text-destructive">*</span>
              </label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="editMinPoint" className="text-sm font-medium">
                  Minimum Point <span className="text-destructive">*</span>
                </label>
                <Input
                  id="editMinPoint"
                  type="number"
                  value={editMinPoint}
                  onChange={(e) => setEditMinPoint(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="editMaxPoint" className="text-sm font-medium">
                  Maksimum Point
                </label>
                <Input
                  id="editMaxPoint"
                  type="number"
                  value={editMaxPoint}
                  onChange={(e) => setEditMaxPoint(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="editDescription" className="text-sm font-medium">Deskripsi</label>
              <textarea
                id="editDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Deskripsi level membership"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Gambar/Logo Level</label>
              <div className="flex items-center gap-4">
                {editImagePreview ? (
                  <div className="relative size-20 rounded-lg overflow-hidden border">
                    <Image
                      src={editImagePreview}
                      alt="Preview"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 size-5 rounded-full"
                      onClick={() => {
                        setEditImagePreview(null)
                        setEditFile(null)
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="size-20 rounded-lg border-2 border-dashed flex items-center justify-center">
                    <ImagePlus className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, max 15MB</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetEditForm(); }}>
              Batal
            </Button>
            <Button onClick={handleUpdate} disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus member level &quot;{selectedLevel?.name}&quot;? Aksi ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
