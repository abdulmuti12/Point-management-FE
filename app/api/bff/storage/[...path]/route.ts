import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, lstatSync } from "fs";
import { isAbsolute, normalize, join } from "path";
import { Readable } from "stream";

// Mirrors Laravel's "public" filesystem disk (root => storage/app/public).
//
// `php artisan serve` only exposes API routes — it does NOT serve the public/
// static docroot, so a direct /storage/... URL against the API host 404s. This
// proxy reads the file from disk and streams it back to the browser, which works
// regardless of how the API is served.
const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// Absolute root of the API's public storage disk.
// Override with API_STORAGE_DIR if the API lives somewhere else.
const STORAGE_ROOT = process.env.API_STORAGE_DIR
  ? normalize(process.env.API_STORAGE_DIR)
  : "/var/www/html/Royalti-Go/storage/app/public";

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  let rawPath = path.join("/");

  // The API returns absolute storage URLs like "http://host/storage/logos/x.png".
  // Reduce them to the on-disk relative path ("logos/x.png").
  if (rawPath.includes("://")) {
    const u = new URL(rawPath);
    rawPath = u.pathname.replace(/^\/storage\//, "");
  }

  if (!rawPath) {
    return NextResponse.json({ success: false, message: "Missing storage path" }, { status: 400 });
  }

  // Lock the path inside the storage disk root to prevent traversal.
  const clean = normalize(`/${rawPath}`);
  if (rawPath.includes("\0") || clean === "/" || !clean.startsWith("/")) {
    return NextResponse.json({ success: false, message: "Invalid storage path" }, { status: 403 });
  }

  const absPath = join(STORAGE_ROOT, clean.slice(1));
  const normalized = normalize(absPath);
  if (!isAbsolute(normalized) || !normalized.startsWith(normalize(STORAGE_ROOT))) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(normalized)) {
    return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
  }
  try {
    if (lstatSync(normalized).isSymbolicLink()) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
  } catch {
    // stat raced with deletion; fall through to 404
    return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
  }

  const ext = normalized.slice(normalized.lastIndexOf(".")).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  const stream = createReadStream(normalized);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
