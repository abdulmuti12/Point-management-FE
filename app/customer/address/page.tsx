"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, X, Pencil, Trash2, Loader2 } from "lucide-react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

type AddressText = {
  id: string
  address: string
  note?: string | null
  status: "active" | "inactive"
}

export default function CustomerAddressPage() {
  const router = useRouter()

  const [addresses, setAddresses] = useState<AddressText[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ address: "", note: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const token = localStorage.getItem("customer_token")

  async function fetchAddresses() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/customers/get-address-texts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setAddresses(json.data || [])
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("customer_token")) {
      router.push("/customer/login")
      return
    }
    fetchAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.address.trim()) return
    setSubmitting(true)
    try {
      if (editingId) {
        await fetch(`${API_BASE_URL}/customers/update-address-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: editingId, ...form }),
        })
      } else {
        await fetch(`${API_BASE_URL}/customers/create-address-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        })
      }
      setForm({ address: "", note: "" })
      setEditingId(null)
      setShowForm(false)
      await fetchAddresses()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(id: string) {
    try {
      await fetch(`${API_BASE_URL}/customers/toggle-address-text-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      })
      await fetchAddresses()
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus alamat ini?")) return
    try {
      await fetch(`${API_BASE_URL}/customers/delete-address-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      })
      await fetchAddresses()
    } catch {}
  }

  function openEdit(addr: AddressText) {
    setForm({ address: addr.address, note: addr.note || "" })
    setEditingId(addr.id)
    setShowForm(true)
  }

  const activeCount = addresses.filter((a) => a.status === "active").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alamat Saya</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola alamat pengiriman Anda.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Alamat
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white/50 border border-black/[0.08] p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{editingId ? "Ubah Alamat" : "Tambah Alamat"}</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">
                Alamat
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows={3}
                placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                className="w-full rounded-lg bg-slate-50 border border-black/[0.08] px-3 py-2.5
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">
                Catatan <span className="text-slate-400 normal-case">(opsional)</span>
              </label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Contoh: rumah, kantor, dll."
                className="w-full rounded-lg bg-slate-50 border border-black/[0.08] px-3 py-2.5
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !form.address.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700
                           disabled:opacity-40 px-4 py-2 text-xs font-medium text-white
                           transition-colors"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {editingId ? "Simpan" : "Tambah"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-black/[0.08] px-4 py-2 text-xs text-slate-500
                           hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-white/50 border border-black/[0.08] p-8 flex items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl bg-white/50 border border-black/[0.08] p-8 text-center backdrop-blur-sm">
          <MapPin className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 text-sm">Belum ada alamat tersimpan.</p>
          <p className="text-slate-400 text-xs mt-1">
            Tambahkan alamat pengiriman Anda untuk kemudahan transaksi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-xl border backdrop-blur-sm transition-colors ${
                addr.status === "active"
                  ? "bg-emerald-50/60 border-emerald-500/25"
                  : "bg-white/50 border-black/[0.08]"
              }`}
            >
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      addr.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900 leading-relaxed">{addr.address}</p>
                    {addr.note && <p className="text-xs text-slate-400 mt-1">{addr.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {addr.status === "active" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                     bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                      Aktif
                    </span>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50
                               transition-colors"
                    title="Ubah"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(addr.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      addr.status === "active"
                        ? "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        : "text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50/50"
                    }`}
                    title={addr.status === "active" ? "Nonaktifkan" : "Jadikan aktif"}
                  >
                    <X className={`w-3.5 h-3.5 ${addr.status === "active" ? "" : "hidden"}`} />
                    <MapPin className={`w-3.5 h-3.5 ${addr.status === "active" ? "hidden" : ""}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/60
                               transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeCount === 0 && addresses.length > 0 && (
        <p className="text-xs text-amber-600">
          Tidak ada alamat aktif. Aktivkan salah satu alamat di atas untuk pengiriman.
        </p>
      )}
    </div>
  )
}
