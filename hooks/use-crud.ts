"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import type { PaginatedResponse, PaginationMeta } from "@/lib/types"

export interface UseCrudOptions<T> {
  /** Stable SWR key — null to disable fetching. */
  key: string | null
  /**
   * Custom fetcher for the SWR key.
   * Must return PaginatedResponse<T> or null on failure.
   */
  fetcher?: (key: string) => Promise<PaginatedResponse<T> | null>
  pageSize?: number
  /** Refetch interval in ms (0 = off). */
  refreshInterval?: number
}

export interface UseCrudResult<T> {
  data: T[]
  meta: PaginationMeta | null
  page: number
  totalPages: number
  total: number
  loading: boolean
  error: string
  isValidating: boolean
  search: string
  setSearch: (s: string) => void
  setPage: (p: number) => void
  refresh: () => void
}

/**
 * Default fetcher — fetches a BFF admin list endpoint.
 * Expects the response to have shape: { success, data: { data: T[], meta } }
 */
async function defaultFetcher<T>(endpoint: string): Promise<PaginatedResponse<T> | null> {
  const res = await fetch(endpoint, { credentials: "same-origin" })

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login"
    throw new Error("Unauthenticated")
  }

  const json = await res.json()
  if (!json.success) return null
  return json.data as PaginatedResponse<T>
}

export function useCrud<T>(options: UseCrudOptions<T>): UseCrudResult<T> {
  const { key, fetcher, pageSize = 10, refreshInterval = 0 } = options

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const fullKey = key
    ? `${key}?page=${page}&per_page=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    : null

  const {
    data: rawData,
    error: swrError,
    isValidating,
    mutate,
  } = useSWR<PaginatedResponse<T> | null>(
    fullKey,
    fetcher ? (k: string) => fetcher(k) : (k: string) => defaultFetcher<T>(k),
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  )

  const data = rawData?.data ?? []
  const meta = rawData?.meta ?? null
  const totalPages = meta?.last_page ?? 1
  const total = meta?.total ?? 0

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  const error = swrError ? (swrError instanceof Error ? swrError.message : "Gagal memuat data.") : ""

  return {
    data,
    meta,
    page,
    totalPages,
    total,
    loading: !rawData && !swrError,
    error,
    isValidating,
    search,
    setSearch,
    setPage,
    refresh,
  }
}
