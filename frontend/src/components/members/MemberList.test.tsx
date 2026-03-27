import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Member } from "../../api/types";
import { MemberList } from "./MemberList";

const baseMember = (overrides: Partial<Member> = {}): Member => ({
  id: "11111111-1111-4111-8111-111111111111",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("MemberList", () => {
  it("shows loading state", () => {
    renderWithRouter(<MemberList members={[]} loading />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    renderWithRouter(<MemberList members={[]} loading={false} />);
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("renders member rows with links", () => {
    renderWithRouter(<MemberList members={[baseMember()]} loading={false} />);
    const link = screen.getByRole("link", { name: /Jane Doe.*jane@example.com/i });
    expect(link).toHaveAttribute("href", "/members/11111111-1111-4111-8111-111111111111");
  });

  it("shows active membership badge when flagged", () => {
    renderWithRouter(
      <MemberList members={[baseMember({ hasActiveMembership: true })]} loading={false} />,
    );
    expect(screen.getByText("Active membership")).toBeInTheDocument();
  });
});
