"use client"

import { useState, useEffect } from "react"
import { Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  FileText,
  Factory,
  Building2,
  Tag,
  Barcode,
  User,
} from "lucide-react"
import type { Material, Product } from "@/lib/types"
import { adminGetFetcher, adminMutate, notifySuccess, notifyError } from "@/lib/swr"
import { ImageUploadGrid, type ImageUploadValue } from "./image-upload"
import { ProductFormFields, type ProductFormState } from "./product-form-fields"
import { getImageUrl, getProductMaterialsText } from "./product-table"

const EMPTY_FORM: ProductFormState = {
  name: "",
  sku_product: "",
  brand_id: "",
  category_id: "",
  description: "",
  size: "",
  status: "active",
  product_type: "",
  color: "",
  made_ids: [],
}

const EMPTY_IMAGES: ImageUploadValue = {
  image1: null, image2: null, image3: null,
  image4: null, image5: null, image6: null,
}

/* ── Build FormData from form + images ────────────────────────── */

function buildProductFormData(
  form: ProductFormState,
  images: ImageUploadValue,
  isEdit: boolean,
): FormData {
  const fd = new FormData()
  if (isEdit) fd.append("_method", "PUT")
  fd.append("name", form.name)
  fd.append("sku_product", form.sku_product)
  fd.append("brand_id", form.brand_id)
  fd.append("category_id", form.category_id)
  fd.append("description", form.description)
  fd.append("size", form.size)
  fd.append("status", form.status)
  fd.append("product_type", form.product_type)
  fd.append("color", form.color)
  form.made_ids.forEach((id) => fd.append("made_ids[]", id.toString()))
  ;(Object.keys(images) as (keyof ImageUploadValue)[]).forEach((key) => {
    if (images[key]) fd.append(key, images[key]!)
  })
  return fd
}

/* ── Validate form ──────────────────────────────────��──────────── */

function validateForm(form: ProductFormState): string | null {
  if (!form.name.trim()) return "Product name is required"
  if (!form.brand_id) return "Brand is required"
  if (!form.category_id) return "Category is required"
  if (!form.product_type.trim()) return "Product Type is required"
  if (!form.color.trim()) return "Color is required"
  return null
}

/* ── ProductDetailDialog ──────────────────────────────────────── */

export function ProductDetailDialog({
  open,
  onClose,
  product,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  product: Product | null
  onOpen: (p: Product) => void
}) {
  const [detail, setDetail] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoomIndex, setZoomIndex] = useState<number | null>(null)
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    if (!open || !product) return
    setDetail(null)
    setError(null)
    setLoading(true)
    adminGetFetcher<{ success: boolean; message?: string; data: { general?: Product } }>(
      `admins/product/${product.id}`,
    )
      .then((result) => {
        if (result.ok && result.data?.success && result.data.data?.general) {
          setDetail(result.data.data.general)
        } else {
          setError((result.data as { message?: string }).message || "Failed to load product details")
        }
      })
      .catch(() => setError("Failed to fetch product details"))
      .finally(() => setLoading(false))
  }, [open, product])

  const images = detail
    ? [detail.image1, detail.image2, detail.image3, detail.image4, detail.image5, detail.image6]
    : []

  if (!open) return null

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Detailed information about the selected product.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground ml-2">Loading...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <p className="text-red-600 font-medium">{error}</p>
              {product && (
                <Button onClick={() => onOpen(product)}>
                  <Loader2 className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Images */}
              <div className="grid grid-cols-6 gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded overflow-hidden bg-slate-100 flex items-center justify-center"
                  >
                    {img ? (
                      <button
                        onClick={() => { setZoomIndex(i); setZoomOpen(true) }}
                        className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`${detail.name} - Image ${i + 1}`}
                          className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=80"
                          }}
                        />
                      </button>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Info grid */}
              <div className="space-y-4">
                <InfoRow icon={<User className="h-4 w-4 text-blue-600" />} iconBg="bg-blue-100" label="Product Name" value={detail.name} />
                <InfoRow icon={<Barcode className="h-4 w-4 text-amber-600" />} iconBg="bg-amber-100" label="SKU" value={detail.sku_product || "N/A"} mono />
                <InfoRow icon={<Tag className="h-4 w-4 text-purple-600" />} iconBg="bg-purple-100" label="Category" value={detail.category || "None"} />
                <InfoRow icon={<Building2 className="h-4 w-4 text-green-600" />} iconBg="bg-green-100" label="Brand" value={detail.brand || "None"} />
                <InfoRow icon={<Factory className="h-4 w-4 text-yellow-600" />} iconBg="bg-yellow-100" label="Made By" value={getProductMaterialsText(detail)} />
                <InfoRow icon={<Tag className="h-4 w-4 text-emerald-600" />} iconBg="bg-emerald-100" label="Status" value={detail.status || "N/A"} />
                <InfoRow icon={<Calendar className="h-4 w-4 text-orange-600" />} iconBg="bg-orange-100" label="Created" value={detail.created_at ? new Date(detail.created_at).toLocaleDateString() : "N/A"} />
                <InfoRow icon={<Clock className="h-4 w-4 text-red-600" />} iconBg="bg-red-100" label="Updated" value={detail.updated_at ? new Date(detail.updated_at).toLocaleDateString() : "N/A"} />
                <InfoRow icon={<FileText className="h-4 w-4 text-indigo-600" />} iconBg="bg-indigo-100" label="Description" value={detail.description || "No description"} />
                <InfoRow icon={<Tag className="h-4 w-4 text-pink-600" />} iconBg="bg-pink-100" label="Size" value={detail.size || "No size info"} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load product details</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image zoom */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Product Image</DialogTitle>
          </DialogHeader>
          {detail && zoomIndex !== null && (
            <div className="flex justify-center">
              <img
                src={getImageUrl(images[zoomIndex] ?? null)}
                alt={`${detail.name} - ${zoomIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=400"
                }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoomOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InfoRow({
  icon, iconBg, label, value, mono,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${iconBg} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`font-medium ${mono ? "font-mono" : ""} truncate`}>{value}</p>
      </div>
    </div>
  )
}

/* ── Create / Edit Dialog (shared) ────────────────────────────── */

interface ProductFormDialogProps {
  mode: "create" | "edit"
  open: boolean
  onClose: () => void
  product?: Product | null
  categories: { id: number; name: string }[]
  brands: { id: number; name: string }[]
  materials: Material[]
  categoriesLoading: boolean
  brandsLoading: boolean
  materialsLoading: boolean
  onSuccess: () => void
}

export function ProductFormDialog({
  mode,
  open,
  onClose,
  product,
  categories,
  brands,
  materials,
  categoriesLoading,
  brandsLoading,
  materialsLoading,
  onSuccess,
}: ProductFormDialogProps) {
  const isEdit = mode === "edit"
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [images, setImages] = useState<ImageUploadValue>(EMPTY_IMAGES)
  const [existingImages, setExistingImages] = useState<Partial<Record<keyof ImageUploadValue, string | null>>>({})
  const [loading, setLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  // Load product data when edit dialog opens
  useEffect(() => {
    if (!isEdit || !open || !product) return
    setEditLoading(true)
    adminGetFetcher<{ success: boolean; message?: string; data: Record<string, unknown> }>(
      `admins/edit-product/${product.id}`,
    )
      .then((result) => {
        if (result.ok) {
          const d = result.data
          if (d.success) {
            const p = d.data as Record<string, unknown>
            const normalizedMadeIds: number[] = Array.isArray(p.made_ids)
              ? p.made_ids
              : Array.isArray(p.mades)
                ? (p.mades as { id: number }[]).map((m) => m.id)
                : []
            setForm({
              name: p.name as string,
              sku_product: (p.sku_product as string) || "",
              brand_id: String(p.brand_id ?? ""),
              category_id: String(p.category_id ?? ""),
              description: p.description as string,
              size: (p.size as string) || "",
              status: p.status ? String(p.status).toLowerCase() : "active",
              product_type: p.product_type as string,
              color: p.color as string,
              made_ids: normalizedMadeIds,
            })
            setExistingImages({
              image1: p.image1 as string | null,
              image2: p.image2 as string | null,
              image3: p.image3 as string | null,
              image4: p.image4 as string | null,
              image5: p.image5 as string | null,
              image6: p.image6 as string | null,
            })
            setImages(EMPTY_IMAGES)
          } else {
            notifyError(d.message || "Failed to load product data")
            onClose()
          }
        } else {
          notifyError("Failed to load product data")
          onClose()
        }
      })
      .catch(() => {
        notifyError("Failed to load product data")
        onClose()
      })
      .finally(() => setEditLoading(false))
  }, [isEdit, open, product])

  const handleFieldChange = (field: keyof ProductFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleMaterialToggle = (id: number) =>
    setForm((prev) => ({
      ...prev,
      made_ids: prev.made_ids.includes(id)
        ? prev.made_ids.filter((m) => m !== id)
        : [...prev.made_ids, id],
    }))

  const handleImageChange = (key: keyof ImageUploadValue, file: File | null) =>
    setImages((prev) => ({ ...prev, [key]: file }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setImages(EMPTY_IMAGES)
    setExistingImages({})
  }

  const handleSubmit = async () => {
    const validationError = validateForm(form)
    if (validationError) {
      notifyError(validationError)
      return
    }

    setLoading(true)
    try {
      const fd = buildProductFormData(form, images, isEdit)
      const endpoint = isEdit ? `admins/product/${product!.id}` : "admins/product"
      const result = await adminMutate<{ success: boolean; message?: string }>(endpoint, {
        method: "POST",
        body: fd,
        headers: {},
      })

      if (result.data.success) {
        notifySuccess(isEdit ? "Product updated successfully!" : "Product created successfully!")
        resetForm()
        onClose()
        onSuccess()
      } else {
        notifyError(result.data.message || (isEdit ? "Failed to update product" : "Failed to create product"))
      }
    } catch {
      notifyError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const effectiveExistingImages = isEdit
    ? Object.fromEntries(
        Object.entries(existingImages).map(([k, v]) => [
          k,
          (images as Record<string, File | null>)[k] ? undefined : v,
        ]),
      )
    : undefined

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Create New Product"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update product information." : "Add a new product to your inventory."}</DialogDescription>
        </DialogHeader>

        {isEdit && editLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground ml-2">Loading product data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ProductFormFields
              form={form}
              onFieldChange={handleFieldChange}
              onMaterialToggle={handleMaterialToggle}
              categories={categories}
              brands={brands}
              materials={materials}
              categoriesLoading={categoriesLoading}
              brandsLoading={brandsLoading}
              materialsLoading={materialsLoading}
            />

            <Separator />

            <ImageUploadGrid
              title="Product Images"
              value={images}
              onChange={handleImageChange}
              existingImages={effectiveExistingImages}
              required
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || (isEdit && editLoading)}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : isEdit ? "Update Product" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── DeleteDialog ──────────────────────────────────────────────── */

export function DeleteProductDialog({
  open,
  onClose,
  product,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  product: Product | null
  onConfirm: () => void
  loading: boolean
}) {
  if (!open || !product) return null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
          {product.image1 ? (
            <div className="w-10 h-10 rounded overflow-hidden bg-slate-100 flex-shrink-0">
              <img
                src={getImageUrl(product.image1)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-red-900 truncate">{product.name}</p>
            <p className="text-sm text-red-700">ID: {product.id}</p>
            {product.sku_product && <p className="text-sm text-red-700 font-mono">SKU: {product.sku_product}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
