/**
 * Frontend auth helpers.
 *
 * After the BFF migration:
 * - Admin tokens live in the `admin_auth` HttpOnly cookie (set by /api/bff/login).
 * - Customer tokens live in the `customer_auth` HttpOnly cookie (set by /api/bff/customer/login).
 *
 * The browser NEVER sees the JWT. All API calls go through /api/bff/admin/<endpoint>
 * or /api/bff/customer/<endpoint>, and the BFF route handler injects the Bearer token
 * from the cookie server-side.
 *
 * User profile data (name, email, menus) is still stored in localStorage for UI
 * display purposes — it's non-sensitive metadata, not a credential.
 */

/* ── Fetch helpers ────────────────────────────────────────────── */

/**
 * Make an authenticated admin API call through the BFF.
 * The cookie is sent automatically by the browser (same-origin).
 */
export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const { headers: customHeaders, ...rest } = options;
  const url = endpoint.startsWith("/api/bff/admin")
    ? endpoint
    : `/api/bff/admin/${endpoint.replace(/^\//, "")}`;

  const res = await fetch(url, {
    ...rest,
    credentials: "same-origin", // ensure HttpOnly cookies are sent
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Session expired — redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthenticated");
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Make an authenticated customer API call through the BFF.
 */
export async function customerFetch(endpoint: string, options: RequestInit = {}) {
  const { headers: customHeaders, ...rest } = options;
  const url = endpoint.startsWith("/api/bff/customer")
    ? endpoint
    : `/api/bff/customer/${endpoint.replace(/^\//, "")}`;

  const res = await fetch(url, {
    ...rest,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/customer/login";
    }
    throw new Error("Unauthenticated");
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Check if the user has a valid session (cookie present on the server side).
 */
export async function checkAuth(): Promise<{
  authenticated: boolean;
  role: "admin" | "customer" | null;
}> {
  const res = await fetch("/api/bff/me", { credentials: "same-origin" });
  return res.json();
}

/* ── Logout helpers ───────────────────────────────────────────── */

export async function logoutAdmin() {
  await fetch("/api/bff/logout", { method: "POST", credentials: "same-origin" });
  localStorage.removeItem("user_menus");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
}

export async function logoutCustomer() {
  await fetch("/api/bff/customer/logout", { method: "POST", credentials: "same-origin" });
  localStorage.removeItem("customer_name");
  localStorage.removeItem("customer_email");
}
