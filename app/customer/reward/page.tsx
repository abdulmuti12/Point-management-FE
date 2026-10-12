"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  Sparkles,
  Crown,
  X,
  Award,
  Coins,
  Gift,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { customerFetch } from "@/lib/auth"

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserData {
  id: number
  name: string
  full_name: string
  email: string
  phone_number: string | null
  avatar: string | null
}

interface MemberLevelInfo {
  id: string
  name: string
  min_point: number
  max_point: number
  image_url: string | null
  description: string | null
}

interface MemberLevelData {
  total_points: number
  current_level: MemberLevelInfo | null
  next_level: MemberLevelInfo | null
  progress: {
    current: number
    min: number
    target: number
    percent: number
  } | null
  all_levels: MemberLevelInfo[]
}

type ClaimStatus = "waiting" | "approved" | "rejected" | "completed"

interface Gift {
  id: string
  name: string
  total_point: number
  image: string | null
  description: string | null
  claimable: boolean
  pending_claim: { id: string; status: ClaimStatus } | null
  claim_status: string | null
}

interface GiftsData {
  total_points: number
  gifts: Gift[]
  stats: {
    total_points: number
    open_count: number
    closed_count: number
  }
}

interface GiftClaim {
  id: string
  gift_id: string
  gift_name: string | null
  gift_image: string | null
  required_point: number
  status: ClaimStatus
  notes: string | null
  admin_note: string | null
  created_at: string | null
  approved_at: string | null
  completed_at: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(phone: string | null | undefined) {
  if (!phone) return "—"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("62")) {
    return "+" + cleaned.replace(/(\d{2})(\d{3})(\d{4})(\d{0,4})/, "$1 $2 $3 $4").trim()
  }
  if (cleaned.startsWith("0")) {
    const converted = "62" + cleaned.substring(1)
    return "+" + converted.replace(/(\d{2})(\d{3})(\d{4})(\d{0,4})/, "$1 $2 $3 $4").trim()
  }
  return phone
}

function levelAccent(name: string) {
  const n = name.toLowerCase()
  if (n.includes("platinum") || n.includes("diamond")) {
    return { ring: "ring-cyan-400/40", glow: "shadow-cyan-500/20", text: "text-cyan-400", bg: "from-cyan-900/30 to-neutral-900/40" }
  }
  if (n.includes("gold")) {
    return { ring: "ring-amber-400/60", glow: "shadow-amber-500/30", text: "text-amber-400", bg: "from-amber-900/30 to-neutral-900/40" }
  }
  if (n.includes("silver")) {
    return { ring: "ring-slate-300/40", glow: "shadow-slate-300/20", text: "text-slate-300", bg: "from-slate-700/30 to-neutral-900/40" }
  }
  if (n.includes("bronze") || n.includes("copper")) {
    return { ring: "ring-orange-500/40", glow: "shadow-orange-500/20", text: "text-orange-400", bg: "from-orange-900/30 to-neutral-900/40" }
  }
  return { ring: "ring-neutral-700/40", glow: "shadow-black/40", text: "text-amber-300", bg: "from-neutral-800/40 to-neutral-900/40" }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerRewardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [memberLevel, setMemberLevel] = useState<MemberLevelData | null>(null)
  const [gifts, setGifts] = useState<Gift[]>([])
  const [activePoints, setActivePoints] = useState(0)
  const [giftsLoading, setGiftsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<MemberLevelInfo | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await customerFetch("me")
        if (data.success && data.data) setUser(data.data as UserData)
      } catch (err) {
        console.error("Fetch user error:", err)
      }

      try {
        const { data } = await customerFetch("member-level")
        if (data.success && data.data) setMemberLevel(data.data as MemberLevelData)
      } catch (err) {
        console.error("Fetch member level error:", err)
      }

      try {
        const { data } = await customerFetch("gifts")
        if (data.success && data.data) {
          const gd = data.data as GiftsData
          setGifts(gd.gifts)
          setActivePoints(gd.total_points)
        }
      } catch (err) {
        console.error("Fetch gifts error:", err)
      } finally {
        setGiftsLoading(false)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedLevel(null)
    }
    if (selectedLevel) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
      return () => {
        document.removeEventListener("keydown", onKey)
        document.body.style.overflow = ""
      }
    }
  }, [selectedLevel])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">Reward</h1>
        <p className="text-slate-500 text-sm">Points dari setiap transaksi Anda.</p>
      </div>

      {/* Member Level Section */}
      <div>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Member Level
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kartu membership dan tier reward Anda.
            </p>
          </div>
          {memberLevel && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Poin Terkumpul</p>
              <p className="text-2xl font-light text-amber-600">
                {memberLevel.total_points.toLocaleString("id-ID")}
                <span className="text-xs text-slate-500 ml-1">poin</span>
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : memberLevel && memberLevel.all_levels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberLevel.all_levels.map((level) => (
              <MemberLevelCard
                key={level.id}
                level={level}
                isCurrent={memberLevel.current_level?.id === level.id}
                isUnlocked={
                  !!memberLevel.current_level &&
                  level.min_point <= memberLevel.current_level.min_point
                }
                user={user}
                onClick={() => setSelectedLevel(level)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
            Data member level belum tersedia.
          </div>
        )}

        {/* Progress bar ke next level */}
        {memberLevel?.progress && memberLevel.next_level && (
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600">
                Progress menuju{" "}
                <span className="font-medium text-amber-600">
                  {memberLevel.next_level.name}
                </span>
              </span>
              <span className="text-xs font-medium text-amber-600">
                {memberLevel.progress.percent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${memberLevel.progress.percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {memberLevel.progress.current.toLocaleString("id-ID")} /{" "}
              {memberLevel.progress.target.toLocaleString("id-ID")} poin
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 mb-2">
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-semibold text-amber-600">
            {giftsLoading ? "…" : activePoints.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Poin Aktif</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 mb-2">
            <Gift className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-emerald-600">
            {giftsLoading ? "…" : (memberLevel?.total_points ?? 0).toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Total Earned</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 mb-2">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-lg font-semibold text-slate-600">
            {giftsLoading ? "…" : gifts.filter((g) => g.pending_claim).length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Klaim Menunggu</p>
        </div>
      </div>

      {/* Gift Catalog Section */}
      <div>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" />
              Gift Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tukar poin Anda dengan hadiah menarik.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Poin Aktif</p>
            <p className="text-2xl font-light text-amber-600">
              {giftsLoading ? "…" : activePoints.toLocaleString("id-ID")}
              <span className="text-xs text-slate-500 ml-1">poin</span>
            </p>
          </div>
        </div>

        {giftsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : gifts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <Gift className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Belum ada hadiah yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((gift) => {
              const remaining = Math.max(0, gift.total_point - activePoints)
              const pendingStatus = gift.pending_claim?.status ?? null
              const isLockedByPending = !!gift.pending_claim
              return (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  activePoints={activePoints}
                  remaining={remaining}
                  pendingStatus={pendingStatus}
                  isLockedByPending={isLockedByPending}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* My Claims — placeholder, akan diimplementasi selanjutnya */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500">My Claims — segera hadir</p>
      </div>

      {/* Member Level Modal */}
      {selectedLevel && user && (
        <MemberLevelModal
          level={selectedLevel}
          user={user}
          isCurrent={memberLevel?.current_level?.id === selectedLevel.id}
          onClose={() => setSelectedLevel(null)}
        />
      )}
    </div>
  )
}

// ── MemberLevelCard ───────────────────────────────────────────────────────────

function MemberLevelCard({
  level,
  isCurrent,
  isUnlocked,
  user,
  onClick,
}: {
  level: MemberLevelInfo
  isCurrent: boolean
  isUnlocked: boolean
  user: UserData | null
  onClick: () => void
}) {
  const accent = levelAccent(level.name)
  const fullName = user?.full_name || user?.name || "Member"
  const phone = formatPhone(user?.phone_number)

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative w-full text-left rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        isCurrent
          ? `shadow-lg ${accent.glow} ring-1 ${accent.ring}`
          : isUnlocked
          ? "border border-slate-200 shadow-sm"
          : "border border-slate-200 shadow-sm opacity-70 hover:opacity-100",
      ].join(" ")}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.bg} pointer-events-none rounded-2xl`} />

      {isCurrent && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium">
          <Crown className="w-3 h-3" />
          Your Level
        </div>
      )}

      {!isUnlocked && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-slate-700/90 text-slate-200 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-slate-600">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Locked
        </div>
      )}

      <div className="relative p-4 flex flex-col gap-3">
        <div className="relative w-full rounded-xl overflow-hidden bg-slate-100">
          <div className="w-full aspect-[16/9] flex items-center justify-center">
            {level.image_url ? (
              <img
                src={level.image_url}
                alt={level.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <Award className="w-12 h-12 text-amber-400/60" />
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none rounded-b-xl" />
          <div className="absolute inset-x-3 bottom-2 text-left">
            <p className="text-[9px] uppercase tracking-[0.2em] text-amber-300/90 mb-0.5">
              Point Program
            </p>
            <p className="text-sm font-medium text-white leading-tight truncate" title={fullName}>
              {fullName}
            </p>
            <p className="text-[11px] text-slate-200/80 truncate" title={phone}>
              {phone}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className={`w-3.5 h-3.5 ${accent.text}`} />
            <p className={`text-xs uppercase tracking-wider font-semibold ${accent.text}`}>
              {level.name}
            </p>
          </div>
          <p className="text-[11px] text-slate-600">
            {level.min_point.toLocaleString("id-ID")}
            {level.max_point > 0
              ? ` – ${level.max_point.toLocaleString("id-ID")} poin`
              : "+ poin"}
          </p>
          {level.description && (
            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
              {level.description}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── MemberLevelModal ──────────────────────────────────────────────────────────

// ── GiftCard ──────────────────────────────────────────────────────────────────

function GiftCard({
  gift,
  activePoints,
  remaining,
  pendingStatus,
  isLockedByPending,
}: {
  gift: Gift
  activePoints: number
  remaining: number
  pendingStatus: ClaimStatus | null
  isLockedByPending: boolean
}) {
  return (
    <div
      className={[
        "relative bg-white border rounded-2xl overflow-hidden transition-all",
        gift.claimable
          ? "border-amber-400/50 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10"
          : isLockedByPending
          ? "border-blue-400/30"
          : "border-slate-200 opacity-75",
      ].join(" ")}
    >
      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        {pendingStatus === "waiting" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-blue-100 border border-blue-300 text-blue-700">
            <Clock className="w-3 h-3" />
            Menunggu
          </span>
        ) : pendingStatus === "approved" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-emerald-100 border border-emerald-300 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Disetujui
          </span>
        ) : gift.claimable ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-amber-100 border border-amber-300 text-amber-700">
            <Sparkles className="w-3 h-3" />
            Bisa Klaim
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-slate-100 border border-slate-300 text-slate-500">
            <Coins className="w-3 h-3" />
            Terkunci
          </span>
        )}
      </div>

      {/* Image */}
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
        {gift.image ? (
          <img
            src={gift.image}
            alt={gift.name}
            className={`w-full h-full object-cover ${gift.claimable || isLockedByPending ? "" : "grayscale"}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Gift className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 truncate">{gift.name}</h3>
        {gift.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{gift.description}</p>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Poin Dibutuhkan</span>
            <span className="text-sm font-semibold text-amber-600">
              {gift.total_point.toLocaleString("id-ID")}
            </span>
          </div>

          {gift.claimable ? (
            <button
              type="button"
              className="w-full py-2 rounded-xl text-xs uppercase tracking-wider font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-colors shadow-sm shadow-amber-500/20"
            >
              Klaim Sekarang
            </button>
          ) : isLockedByPending ? (
            <button
              type="button"
              disabled
              className="w-full py-2 rounded-xl text-xs uppercase tracking-wider font-medium cursor-not-allowed bg-blue-50 border border-blue-200 text-blue-500"
            >
              {pendingStatus === "waiting" ? "Menunggu Approval" : "Disetujui"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 rounded-xl text-xs uppercase tracking-wider font-medium cursor-not-allowed bg-slate-100 border border-slate-200 text-slate-400"
            >
              Butuh {remaining.toLocaleString("id-ID")} poin lagi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MemberLevelModal ──────────────────────────────────────────────────────────

function MemberLevelModal({
  level,
  user,
  isCurrent,
  onClose,
}: {
  level: MemberLevelInfo
  user: UserData
  isCurrent: boolean
  onClose: () => void
}) {
  const accent = levelAccent(level.name)
  const fullName = user.full_name || user.name || "Member"
  const phone = formatPhone(user.phone_number)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={[
          "relative max-w-3xl w-full rounded-3xl overflow-hidden border-2 bg-white",
          isCurrent ? `border-amber-400/70 shadow-2xl ${accent.glow}` : "border-slate-200 shadow-2xl",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${accent.bg} pointer-events-none`} />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6 md:p-8 flex flex-col gap-5">
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100">
            <div className="w-full max-h-[70vh] flex items-center justify-center">
              {level.image_url ? (
                <img
                  src={level.image_url}
                  alt={level.name}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <Award className="w-20 h-20 text-amber-400/60" />
                </div>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-5 bottom-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/90 mb-1">
                Point Program
              </p>
              <p className="text-xl md:text-2xl font-medium text-white leading-tight" title={fullName}>
                {fullName}
              </p>
              <p className="text-sm text-slate-200/80 mt-0.5" title={phone}>
                {phone}
              </p>
            </div>

            {isCurrent && (
              <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 bg-amber-500 text-white text-xs uppercase tracking-wider px-3 py-1.5 rounded-full font-medium">
                <Crown className="w-3.5 h-3.5" />
                Your Level
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className={`w-5 h-5 ${accent.text}`} />
              <p className={`text-base md:text-lg uppercase tracking-wider font-semibold ${accent.text}`}>
                {level.name}
              </p>
            </div>
            <p className="text-sm text-slate-700">
              {level.min_point.toLocaleString("id-ID")}
              {level.max_point > 0
                ? ` – ${level.max_point.toLocaleString("id-ID")} poin`
                : "+ poin"}
            </p>
            {level.description && (
              <p className="text-sm text-slate-600 mt-3">{level.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
