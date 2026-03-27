import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemberSearchBar } from "./MemberSearchBar";

describe("MemberSearchBar", () => {
  it("reflects value and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<MemberSearchBar value="" onChange={onChange} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "ab");
    expect(onChange).toHaveBeenCalled();
    rerender(<MemberSearchBar value="ab" onChange={onChange} />);
    expect(input).toHaveValue("ab");
  });
});
