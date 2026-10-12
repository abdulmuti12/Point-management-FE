/**
 * SWR fetcher factory + helpers.
 *
 * All API calls flow through /api/bff/<role>/... so the BFF injects
 * the Bearer token from the HttpOnly cookie — the browser never sees it.
 */
import type { FetchResult, PaginatedResponse } from "@/lib/types"

export interface ListParams {
  page?: number
  per_page?: number
  search?: string
}

export interface ListResult<T> extends FetchResult {
  data: PaginatedResponse<T>
}

/* ── Core BFF fetcher ─────────────────────────────────────────── */

async function bffFetch(endpoint: string, options: RequestInit = {}): Promise<FetchResult> {
  const url = endpoint.startsWith("/api/bff")
    ? endpoint
    : `/api/bff/${endpoint.replace(/^\//, "")}`

  const res = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = endpoint.includes("customer") ? "/customer/login" : "/login"
    throw new Error("Unauthenticated")
  }

  return { ok: res.ok, status: res.status, data }
}

/* ── Build query string from ListParams ───────────────────────── */

function buildQuery(params: ListParams): string {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.per_page) qs.set("per_page", String(params.per_page))
  if (params.search) qs.set("search", params.search)
  const q = qs.toString()
  return q ? `?${q}` : ""
}

/* ── Admin fetchers ───────────────────────────────────────────── */

export function adminListFetcher<T>(endpoint: string, params: ListParams = {}): Promise<ListResult<T>> {
  return bffFetch(`/api/bff/admin/${endpoint.replace(/^\//, "")}${buildQuery(params)}`) as unknown as Promise<ListResult<T>>
}

export function adminGetFetcher<T>(endpoint: string): Promise<FetchResult & { data: T }> {
  return bffFetch(`/api/bff/admin/${endpoint.replace(/^\//, "")}`) as unknown as Promise<FetchResult & { data: T }>
}

export function adminMutate<T>(endpoint: string, options: RequestInit = {}): Promise<FetchResult & { data: T }> {
  const { method, body, ...rest } = options
  return bffFetch(`/api/bff/admin/${endpoint.replace(/^\//, "")}`, { ...rest, method, body }) as unknown as Promise<
    FetchResult & { data: T }
  >
}

/* ── Customer fetchers ────────────────────────────────────────── */

export function customerListFetcher<T>(endpoint: string, params: ListParams = {}): Promise<ListResult<T>> {
  return bffFetch(`/api/bff/customer/${endpoint.replace(/^\//, "")}${buildQuery(params)}`) as unknown as Promise<ListResult<T>>
}

export function customerGetFetcher<T>(endpoint: string): Promise<FetchResult & { data: T }> {
  return bffFetch(`/api/bff/customer/${endpoint.replace(/^\//, "")}`) as unknown as Promise<FetchResult & { data: T }>
}

export function customerMutate<T>(endpoint: string, options: RequestInit = {}): Promise<FetchResult & { data: T }> {
  const { method, body, ...rest } = options
  return bffFetch(`/api/bff/customer/${endpoint.replace(/^\//, "")}`, { ...rest, method, body }) as unknown as Promise<
    FetchResult & { data: T }
  >
}

/* ── Notification helpers (uses sonner which is already installed) ── */

import { toast } from "sonner"

export function notifySuccess(message: string) {
  toast.success(message)
}

export function notifyError(message: string) {
  toast.error(message)
}

export function notifyInfo(message: string) {
  toast.info(message)
}
