import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Member } from "../../api/types";
import { AddMemberModal } from "./AddMemberModal";

const created: Member = {
  id: "22222222-2222-4222-8222-222222222222",
  firstName: "John",
  lastName: "Smith",
  email: "john@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../api/client";

describe("AddMemberModal", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <AddMemberModal open={false} onClose={() => {}} onMemberCreated={() => {}} />,
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it("validates email before calling API", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockResolvedValue(created);
    const onClose = vi.fn();
    render(<AddMemberModal open onClose={onClose} onMemberCreated={() => {}} />);
    await user.type(screen.getByLabelText(/^first name/i), "John");
    await user.type(screen.getByLabelText(/^last name/i), "Smith");
    await user.type(screen.getByLabelText(/^email/i), "not-email");
    const form = screen.getByRole("dialog").querySelector("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    expect(apiRequest).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
  });

  it("submits and closes on success", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockResolvedValue(created);
    const onClose = vi.fn();
    const onMemberCreated = vi.fn().mockResolvedValue(undefined);
    render(<AddMemberModal open onClose={onClose} onMemberCreated={onMemberCreated} />);
    await user.type(screen.getByLabelText(/^first name/i), "John");
    await user.type(screen.getByLabelText(/^last name/i), "Smith");
    await user.type(screen.getByLabelText(/^email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiRequest).toHaveBeenCalledWith(
      "/members",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          firstName: "John",
          lastName: "Smith",
          email: "john@example.com",
        }),
      }),
    );
    expect(onMemberCreated).toHaveBeenCalled();
  });

  it("shows API error message", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockRejectedValue(new Error("Duplicate email"));
    render(<AddMemberModal open onClose={() => {}} onMemberCreated={() => {}} />);
    await user.type(screen.getByLabelText(/^first name/i), "John");
    await user.type(screen.getByLabelText(/^last name/i), "Smith");
    await user.type(screen.getByLabelText(/^email/i), "john@example.com");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    await screen.findByText("Duplicate email");
  });
});
