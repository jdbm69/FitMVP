import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";

function mockResponse(body: unknown, init: { ok: boolean; status?: number; statusText?: string }): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 400),
    statusText: init.statusText ?? "OK",
    text: async () => text,
  } as Response;
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ id: "1" }, { ok: true })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GET returns parsed JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ items: [1, 2] }, { ok: true }));
    const data = await apiRequest<{ items: number[] }>("/members");
    expect(data).toEqual({ items: [1, 2] });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/members$/),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("normalizes path without leading slash", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({}, { ok: true }));
    await apiRequest("plans");
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/plans$/), expect.anything());
  });

  it("uses API error message when present", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ error: { message: "Plan not found", code: "X" } }, { ok: false, status: 404 }),
    );
    await expect(apiRequest("/plans/x")).rejects.toThrow("Plan not found");
  });

  it("falls back to statusText when error body has no message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({}, { ok: false, status: 500, statusText: "Server exploded" }),
    );
    await expect(apiRequest("/x")).rejects.toThrow("Server exploded");
  });

  it("falls back to Network error when no statusText", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({}, { ok: false, status: 500, statusText: "" }),
    );
    await expect(apiRequest("/x")).rejects.toThrow("Network error");
  });

  it("parses empty body as empty object on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "No Content",
      text: async () => "",
    } as Response);
    const data = await apiRequest<Record<string, never>>("/ok");
    expect(data).toEqual({});
  });
});
