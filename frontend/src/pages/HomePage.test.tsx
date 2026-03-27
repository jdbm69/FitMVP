import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Member } from "../api/types";
import { HomePage } from "./HomePage";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";

const sampleMember: Member = {
  id: "33333333-3333-4333-8333-333333333333",
  firstName: "Alice",
  lastName: "A",
  email: "a@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    vi.mocked(apiRequest).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads members after debounce", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderHome();
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/members"));
    expect(await screen.findByText("No results.")).toBeInTheDocument();
  });

  it("lists members returned by API", async () => {
    vi.mocked(apiRequest).mockResolvedValue([sampleMember]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderHome();
    await vi.advanceTimersByTimeAsync(300);
    expect(await screen.findByText("Alice A")).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
  });

  it("shows error toast when load fails", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error("Network down"));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderHome();
    await vi.advanceTimersByTimeAsync(300);
    expect(await screen.findByText("Network down")).toBeInTheDocument();
  });

  it("opens add member modal", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderHome();
    await vi.advanceTimersByTimeAsync(300);
    vi.useRealTimers();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add member/i }));
    expect(screen.getByRole("dialog", { name: /new member/i })).toBeInTheDocument();
  });
});
