import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./api/client", () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
}));

describe("App", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders header and home route", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    expect(screen.getByRole("link", { name: /fitmvp/i })).toBeInTheDocument();
    expect(screen.getByText("Member management")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(350);
    expect(await screen.findByRole("heading", { name: /^members$/i })).toBeInTheDocument();
  });
});
