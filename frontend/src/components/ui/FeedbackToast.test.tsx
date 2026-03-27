import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackToast } from "./FeedbackToast";

describe("FeedbackToast", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(
      <FeedbackToast message={null} variant="success" onDismiss={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows message and dismiss button", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<FeedbackToast message="Saved" variant="success" onDismiss={onDismiss} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses after autoHideMs", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <FeedbackToast message="Hi" variant="success" onDismiss={onDismiss} autoHideMs={1000} />,
    );
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not schedule timeout when autoHideMs is 0", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<FeedbackToast message="Hi" variant="error" onDismiss={onDismiss} autoHideMs={0} />);
    vi.advanceTimersByTime(60_000);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});
