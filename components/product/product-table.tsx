"use client"

import {
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageIcon,
  X,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Product } from "@/lib/types"

const STORAGE_BASE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL || "http://127.0.0.1:8000/storage/"

export function getImageUrl(filePath: string | null): string {
  if (!filePath) return "/placeholder.svg?height=100&width=100"
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath
  return `${STORAGE_BASE_URL}${filePath}`
}

export function getProductMaterialsText(product: Product): string {
  if (Array.isArray(product.mades) && product.mades.length > 0) {
    return product.mades.map((m) => m.name).join(", ")
  }
  return "None"
}

/* ── SearchBar ──���──────────────────────────────────────────────── */

interface SearchBarProps {
  searchTerm: string
  searchCategory: string
  searchBrand: string
  isSearching: boolean
  hasFilters: boolean
  onSearchTermChange: (v: string) => void
  onSearchCategoryChange: (v: string) => void
  onSearchBrandChange: (v: string) => void
  onSearch: () => void
  onClear: () => void
}

export function SearchBar({
  searchTerm, searchCategory, searchBrand,
  isSearching, hasFilters,
  onSearchTermChange, onSearchCategoryChange, onSearchBrandChange,
  onSearch, onClear,
}: SearchBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col md:flex-row gap-4">
        <FilterInput
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={onSearchTermChange}
          onEnter={onSearch}
        />
        <FilterInput
          placeholder="Filter by category..."
          value={searchCategory}
          onChange={onSearchCategoryChange}
          onEnter={onSearch}
        />
        <FilterInput
          placeholder="Filter by brand..."
          value={searchBrand}
          onChange={onSearchBrandChange}
          onEnter={onSearch}
        />
        <Button onClick={onSearch} disabled={isSearching}>
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
        {hasFilters && (
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterInput({
  placeholder, value, onChange, onEnter,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  onEnter: () => void
}) {
  return (
    <div className="relative flex-1">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/* ── ProductTable ──────────────────────────────────────────────── */

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onView: (p: Product) => void
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}

export function ProductTable({
  products, loading, onView, onEdit, onDelete,
}: ProductTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading products...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="py-12 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="w-[100px]">SKU</TableHead>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Materials</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.id}</TableCell>
              <TableCell className="font-mono text-sm">
                <Badge variant="secondary">{product.sku_product}</Badge>
              </TableCell>
              <TableCell>
                {product.image1 ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-slate-100">
                    <img
                      src={getImageUrl(product.image1)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  </div>
                )}
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                {product.brand ? (
                  <Badge variant="outline">{product.brand}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">None</span>
                )}
              </TableCell>
              <TableCell>
                {product.category ? (
                  <Badge variant="outline">{product.category}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">None</span>
                )}
              </TableCell>
              <TableCell className="max-w-[240px]">
                <span className="text-sm text-muted-foreground">
                  {getProductMaterialsText(product)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <TableRowActions onView={onView} onEdit={onEdit} onDelete={onDelete} product={product} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TableRowActions({
  product, onView, onEdit, onDelete,
}: {
  product: Product
  onView: (p: Product) => void
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}) {
  return (
    <>
      <Button
        variant="ghost" size="icon"
        onClick={() => onView(product)}
        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">View details</span>
      </Button>
      <Button
        variant="ghost" size="icon"
        onClick={() => onEdit(product)}
        className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit</span>
      </Button>
      <Button
        variant="ghost" size="icon"
        onClick={() => onDelete(product)}
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete</span>
      </Button>
    </>
  )
}

/* ── Pagination ────────────────────────────────────────────────── */

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage, totalPages, totalItems, pageSize, onPageChange,
}: PaginationProps) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <strong>{from}-{to}</strong> of <strong>{totalItems}</strong> products
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline" size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  )
}
