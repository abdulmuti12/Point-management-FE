"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  adminGetFetcher,
  adminMutate,
  notifyError,
  notifySuccess,
} from "@/lib/swr"
import type { Product, Material, FetchResult } from "@/lib/types"
import {
  SearchBar,
  ProductTable,
  Pagination,
} from "@/components/product/product-table"
import {
  ProductDetailDialog,
  ProductFormDialog,
  DeleteProductDialog,
} from "@/components/product/product-dialogs"

/* ── Fetcher ──────────────────────────────────────────────────── */

interface ProductListResponse {
  success: boolean
  message?: string
  data: {
    data: Product[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

async function productsFetcher(params: {
  page: number
  search?: string
  category?: string
  brand?: string
}): Promise<ProductListResponse> {
  const qs = new URLSearchParams()
  qs.set("page", String(params.page))
  qs.set("per_page", "10")
  if (params.search) qs.set("name", params.search)
  if (params.category) qs.set("category", params.category)
  if (params.brand) qs.set("brand", params.brand)

  const endpoint = `/api/bff/admin/admins/product?${qs.toString()}`
  const res = await fetch(endpoint, { credentials: "same-origin" })

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login"
    throw new Error("Unauthenticated")
  }

  const json = await res.json()
  if (!json.success) throw new Error(json.message || "API error")
  return json
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function ProductPage() {
  /* Pagination + search state */
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchCategory, setSearchCategory] = useState("")
  const [searchBrand, setSearchBrand] = useState("")
  const [activeSearch, setActiveSearch] = useState<{ term: string; category: string; brand: string }>({
    term: "",
    category: "",
    brand: "",
  })

  /* Dialog state */
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* Lookup data */
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)

  /* SWR — key is a stable string, fetcher receives params */
  const swrKey = JSON.stringify({
    page,
    search: activeSearch.term,
    category: activeSearch.category,
    brand: activeSearch.brand,
  })

  const {
    data: productsData,
    error,
    isValidating,
    mutate,
  } = useSWR(
    swrKey,
    (key: string) => {
      const { page, search, category, brand } = JSON.parse(key)
      return productsFetcher({ page, search, category, brand })
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  )

  const products = productsData?.data?.data ?? []
  const meta = productsData?.data?.meta

  /* Fetch lookup data when a dialog opens */
  const fetchLookupData = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [catRes, brandRes, matRes] = await Promise.all([
        adminGetFetcher<{ success: boolean; data: { id: number; name: string }[] }>("admins/get-category"),
        adminGetFetcher<{ success: boolean; data: { id: number; name: string }[] }>("admins/get-brand"),
        adminGetFetcher<{ success: boolean; data: Material[] }>("admins/get-material"),
      ])
      if (catRes.data.success) setCategories(catRes.data.data)
      if (brandRes.data.success) setBrands(brandRes.data.data)
      if (matRes.data.success) setMaterials(matRes.data.data)
    } catch {
      notifyError("Failed to fetch lookup data")
    } finally {
      setLookupLoading(false)
    }
  }, [])

  useEffect(() => {
    if (createOpen || editOpen) fetchLookupData()
  }, [createOpen, editOpen, fetchLookupData])

  /* Search actions */
  const handleSearch = () => {
    setActiveSearch({ term: searchTerm, category: searchCategory, brand: searchBrand })
    setPage(1)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchCategory("")
    setSearchBrand("")
    setActiveSearch({ term: "", category: "", brand: "" })
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (meta?.last_page ?? 1)) return
    setPage(newPage)
  }

  /* Row actions */
  const handleView = (p: Product) => {
    setDetailProduct(p)
    setDetailOpen(true)
  }

  const handleEdit = (p: Product) => {
    setEditProduct(p)
    setEditOpen(true)
  }

  const handleDeleteClick = (p: Product) => {
    setDeleteProduct(p)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return
    setDeleteLoading(true)
    try {
      const result = await adminMutate<{ success: boolean; message?: string }>(
        `admins/product/${deleteProduct.id}`,
        { method: "DELETE" },
      )
      if (result.data.success) {
        notifySuccess("Product deleted successfully!")
        setDeleteOpen(false)
        setDeleteProduct(null)
        mutate()
      } else {
        notifyError(result.data.message || "Failed to delete product")
      }
    } catch {
      notifyError("Failed to delete product. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSuccess = () => {
    mutate()
  }

  const hasFilters = !!(searchTerm || searchCategory || searchBrand)
  const loading = !productsData && !error
  const totalItems = meta?.total ?? 0
  const totalPages = meta?.last_page ?? 1

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <div className="space-y-4">
        <SearchBar
          searchTerm={searchTerm}
          searchCategory={searchCategory}
          searchBrand={searchBrand}
          isSearching={isValidating}
          hasFilters={hasFilters}
          onSearchTermChange={setSearchTerm}
          onSearchCategoryChange={setSearchCategory}
          onSearchBrandChange={setSearchBrand}
          onSearch={handleSearch}
          onClear={clearSearch}
        />

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center justify-between">
            <span>{error.message || "Failed to load products"}</span>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <ProductTable
              products={products}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />

            {!loading && products.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={10}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <ProductDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={detailProduct}
        onOpen={handleView}
      />

      <ProductFormDialog
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        brands={brands}
        materials={materials}
        categoriesLoading={lookupLoading}
        brandsLoading={lookupLoading}
        materialsLoading={lookupLoading}
        onSuccess={handleSuccess}
      />

      <ProductFormDialog
        mode="edit"
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditProduct(null) }}
        product={editProduct}
        categories={categories}
        brands={brands}
        materials={materials}
        categoriesLoading={lookupLoading}
        brandsLoading={lookupLoading}
        materialsLoading={lookupLoading}
        onSuccess={handleSuccess}
      />

      <DeleteProductDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteProduct(null) }}
        product={deleteProduct}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  )
}
