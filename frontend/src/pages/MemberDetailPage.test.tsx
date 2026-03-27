import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemberSummary, Plan } from "../api/types";
import { MemberDetailPage } from "./MemberDetailPage";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";

const memberId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

const plan: Plan = {
  id: "bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee",
  name: "Basic Monthly",
  priceCents: 3999,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const emptySummary: MemberSummary = {
  memberId,
  activeMembership: null,
  lastCheckInAt: null,
  checkInsLast30Days: 0,
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/members/:memberId" element={<MemberDetailPage />} />
        <Route path="/no-id" element={<MemberDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("MemberDetailPage", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    vi.mocked(apiRequest).mockImplementation(async (url: string) => {
      if (url.includes("/summary")) return emptySummary;
      if (url === "/plans") return [plan];
      throw new Error(`unexpected ${url}`);
    });
  });

  it("shows invalid id when memberId param is missing", () => {
    render(
      <MemoryRouter initialEntries={["/no-id"]}>
        <Routes>
          <Route path="/no-id" element={<MemberDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Invalid ID.")).toBeInTheDocument();
  });

  it("loads summary and shows assign section without active membership", async () => {
    renderAt(`/members/${memberId}`);
    expect(await screen.findByText("Summary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /assign membership/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("assigns membership", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/summary")) return emptySummary;
      if (url === "/plans") return [plan];
      if (url.includes("/memberships") && init?.method === "POST" && !url.includes("/cancel")) {
        return {
          id: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
          memberId,
          planId: plan.id,
          startsAt: new Date().toISOString(),
          cancelledAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return emptySummary;
    });
    renderAt(`/members/${memberId}`);
    await screen.findByRole("heading", { name: /assign membership/i });
    await user.click(screen.getByRole("button", { name: /^assign$/i }));
    await waitFor(() =>
      expect(vi.mocked(apiRequest)).toHaveBeenCalledWith(
        `/members/${memberId}/memberships`,
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("shows API error in toast", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error("boom"));
    renderAt(`/members/${memberId}`);
    expect(await screen.findByText("boom")).toBeInTheDocument();
  });
});
