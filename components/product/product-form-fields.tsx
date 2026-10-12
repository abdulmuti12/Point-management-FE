"use client"

import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Material } from "@/lib/types"

export interface ProductFormState {
  name: string
  sku_product: string
  brand_id: string
  category_id: string
  description: string
  size: string
  status: string
  product_type: string
  color: string
  made_ids: number[]
}

interface ProductFormFieldsProps {
  form: ProductFormState
  onFieldChange: (field: keyof ProductFormState, value: string) => void
  onMaterialToggle: (id: number) => void
  categories: { id: number; name: string }[]
  brands: { id: number; name: string }[]
  materials: Material[]
  categoriesLoading: boolean
  brandsLoading: boolean
  materialsLoading: boolean
  hasExistingImages?: boolean
}

const COLORS = [
  "Red","Green","Blue","Yellow","Cyan","Magenta","Black","White","Gray","Orange",
  "Purple","Pink","Brown","Lime","Olive","Teal","Navy","Maroon","Silver","Gold","Beige",
] as const

const PRODUCT_TYPES = ["Ready Stock", "Sale Stock", "New Arrival"] as const

export function ProductFormFields({
  form,
  onFieldChange,
  onMaterialToggle,
  categories,
  brands,
  materials,
  categoriesLoading,
  brandsLoading,
  materialsLoading,
}: ProductFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Row: Name + SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Product Name *</label>
          <Input
            value={form.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="Enter product name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">SKU Product</label>
          <Input
            value={form.sku_product}
            onChange={(e) => onFieldChange("sku_product", e.target.value)}
            placeholder="e.g., SKU-001234"
          />
        </div>
      </div>

      {/* Row: Brand + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Brand *</label>
          <Select value={form.brand_id} onValueChange={(v) => onFieldChange("brand_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Select a brand"} />
            </SelectTrigger>
            <SelectContent>
              {brandsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : brands.length > 0 ? (
                brands.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                ))
              ) : (
                <div className="py-2 px-3 text-sm text-muted-foreground">No brands available</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Category *</label>
          <Select value={form.category_id} onValueChange={(v) => onFieldChange("category_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select a category"} />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : categories.length > 0 ? (
                categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))
              ) : (
                <div className="py-2 px-3 text-sm text-muted-foreground">No categories available</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row: Product Type + Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product-type">Product Type *</Label>
          <Select value={form.product_type} onValueChange={(v) => onFieldChange("product_type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Color *</label>
          <Select value={form.color} onValueChange={(v) => onFieldChange("color", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row: Status + Materials */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status *</label>
          <Select value={form.status} onValueChange={(v) => onFieldChange("status", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Materials</label>
          <div className="mt-2 border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
            {materialsLoading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : materials.length > 0 ? (
              materials.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.made_ids.includes(m.id)}
                    onChange={() => onMaterialToggle(m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No materials available</div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="Enter product description"
        />
      </div>

      {/* Size */}
      <div>
        <label className="text-sm font-medium">Size</label>
        <Textarea
          rows={3}
          value={form.size}
          onChange={(e) => onFieldChange("size", e.target.value)}
          placeholder="Enter product size information (optional)"
        />
      </div>
    </div>
  )
}
