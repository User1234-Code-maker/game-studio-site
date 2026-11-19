/* Thin, typed client for the Node.js API (server/).
   On static hosting (GitHub Pages) there is no API, so every call reports
   { kind: "offline" } and callers fall back to a browser-only behaviour. */

export type ApiResult<T> =
  | { kind: "ok"; status: number; data: T }
  | { kind: "error"; status: number; code: string; details?: Record<string, string> }
  | { kind: "offline" };

interface ErrorBody {
  code?: string;
  details?: Record<string, string>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });

    // No backend: the host answers with 404/405 or an HTML page.
    if (!response.headers.get("content-type")?.includes("application/json"))
      return { kind: "offline" };

    const data: unknown = await response.json();
    if (response.ok) return { kind: "ok", status: response.status, data: data as T };

    const body = data as ErrorBody;
    return {
      kind: "error",
      status: response.status,
      code: body.code ?? "unknown",
      details: body.details,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { kind: "offline" };
  }
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

export interface NewsSearchResponse {
  items: Array<{ id: string }>;
}

export interface ServicesResponse {
  enabled: boolean;
  currency: string;
  items: Array<{ id: string; name: string; depositCents: number }>;
}

export interface CheckoutResponse {
  url: string;
  id: string;
}

export interface OrderStatusResponse {
  status: "paid" | "pending" | "expired";
  serviceId: string | null;
  service: string | null;
  amount: number | null;
  currency: string;
}
