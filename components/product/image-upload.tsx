"use client"

import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

/* ── ImageUploadSlot ──────────────────────────────────────────── */

export interface ImageSlot {
  key: "image1" | "image2" | "image3" | "image4" | "image5" | "image6"
  label: string
  file: File | null
  existingUrl?: string | null
  required?: boolean
}

export interface ImageUploadValue {
  image1: File | null
  image2: File | null
  image3: File | null
  image4: File | null
  image5: File | null
  image6: File | null
}

interface ImageUploadGridProps {
  title: string
  value: ImageUploadValue
  onChange: (key: keyof ImageUploadValue, file: File | null) => void
  existingImages?: Partial<Record<keyof ImageUploadValue, string | null>>
  required?: boolean
}

export function ImageUploadGrid({
  title,
  value,
  onChange,
  existingImages,
  required,
}: ImageUploadGridProps) {
  const slots = [
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
  ] as const

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="grid grid-cols-2 gap-4">
        {slots.map((key) => (
          <ImageUploadCell
            key={key}
            label={key === "image1" && required ? "Image 1 *" : `Image ${key.slice(-1)}`}
            file={value[key]}
            existingUrl={existingImages?.[key]}
            onFileChange={(file) => onChange(key, file)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Single cell ──────────────────────────────────────────────── */

function ImageUploadCell({
  label,
  file,
  existingUrl,
  onFileChange,
}: {
  label: string
  file: File | null
  existingUrl?: string | null
  onFileChange: (file: File | null) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {file ? (
        <div className="relative">
          <img src={URL.createObjectURL(file)} alt={label} className="w-20 h-20 object-cover rounded border" />
          <button
            onClick={() => onFileChange(null)}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : existingUrl ? (
        <div className="relative">
          <img src={existingUrl} alt={label} className="w-20 h-20 object-cover rounded border" />
          <span className="text-xs text-gray-500 mt-1 block">Current image</span>
        </div>
      ) : null}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        className="w-full p-2 border border-gray-300 rounded-md mt-2"
      />
      {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
    </div>
  )
}
