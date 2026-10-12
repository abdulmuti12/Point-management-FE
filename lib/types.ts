/**
 * Shared API response and domain types.
 * Extracted from individual page files to eliminate duplication.
 */

/* ── Pagination ───────────────────────────────────────────────── */

export interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

/* ── Generic API response envelope ────────────────────────────── */

export interface FetchResult {
  ok: boolean
  status: number
  data: unknown
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
}

/* ── Domain entities ──────────────────────────────────────────── */

export interface Product {
  id: number
  name: string
  sku_product: string
  description: string
  size: string
  status: string
  category: string | null
  brand: string
  made_ids?: number[]
  mades?: { id: number; name: string }[]
  image1: string | null
  image2: string | null
  image3: string | null
  image4: string | null
  image5: string | null
  image6: string | null
  created_at?: string
  updated_at?: string
}

export interface Material {
  id: number
  name: string
  file: string | null
}

export interface Brand {
  id: number
  name: string
  note: string | null
  image: string | null
  description: string
  link?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Customer {
  id: number
  name: string
  full_name?: string
  email: string
  phone_number?: string
  avatar?: string | null
  point?: number
  created_at?: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface MemberLevel {
  id: number
  name: string
  minimum_point: number
  description?: string
  image?: string | null
  created_at?: string
  updated_at?: string
}

export interface Campaign {
  id: number
  title: string
  description: string
  start_date: string
  end_date: string
  status: string
  image?: string | null
  created_at?: string
  updated_at?: string
}

export interface Gift {
  id: number
  name: string
  description: string
  point_cost: number
  image?: string | null
  status?: string
  created_at?: string
  updated_at?: string
}

/* ── Order types ──────────────────────────────────────────────── */

export interface OrderCustomer {
  id: number
  name: string
  full_name?: string
  email: string
  phone_number?: string
  avatar?: string | null
}

export interface PointRule {
  name: string
  range_point: number
  point: number
}

export interface OrderItem {
  product_name: string
  variant_name: string
  image: string
}

export interface OrderItemFull {
  id: number
  product_id: number
  product_name: string
  name?: string
  variant_name: string
  quantity: number
  price: number
  subtotal: number
  image: string
  category?: { id: number; name: string } | null
  brand?: { id: number; name: string } | null
}

export interface ShippingInfo {
  recipient_name: string
  phone: string
  shipping_address: string
  province_id: string | null
  province_name: string | null
  city_id: string | null
  city_name: string | null
  district_id: string | null
  district_name: string | null
  subdistrict_id: string | null
  subdistrict_name: string | null
  postal_code: string | null
}

export interface OrderTotals {
  subtotal: number
  shipping_cost: number
  grand_total: number
  total_items: number
  item_count: number
}

export interface OrderTransaction {
  id?: number
  payment_method?: string
  payment_status?: string
  paid_at?: string | null
  amount?: number
  reference?: string | null
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface Order {
  id: number
  order_number: string
  date: string
  status: OrderStatus
  customer: OrderCustomer
  subtotal: number
  shipping_cost: number
  grand_total: number
  total_items: number
  item_count: number
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface OrderDetail extends Omit<Order, "customer"> {
  shipping: ShippingInfo
  items: OrderItemFull[]
  totals: OrderTotals
  transaction: OrderTransaction | null
  customer_total_transaction?: number
  customer_points?: number
  order_points_delta?: number
  recorded_points?: number
  point_rule?: PointRule | null
}

/* ── Form / lookup option types ───────────────────────────────── */

export interface CustomerOption {
  id: number
  name: string
  full_name?: string
  email: string
}

export interface CategoryOption {
  id: number
  name: string
}

export interface BrandOption {
  id: number
  name: string
}

/* ── Toast type ───────────────────────────────────────────────── */

export interface ToastNotification {
  id: string
  type: "success" | "error" | "info"
  message: string
}
