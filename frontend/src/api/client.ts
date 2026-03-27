import type { ApiErrorBody } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as ApiErrorBody).error;
    if (err?.message) return err.message;
  }
  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : {};

  if (!res.ok) {
    throw new Error(getErrorMessage(data, res.statusText || "Network error"));
  }

  return data as T;
}

export { API_BASE };
