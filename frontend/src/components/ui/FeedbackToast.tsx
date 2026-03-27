import { useEffect, useRef } from "react";

export type FeedbackVariant = "success" | "error";

type FeedbackToastProps = {
  message: string | null;
  variant: FeedbackVariant;
  onDismiss: () => void;
  /** ms; 0 = manual dismiss only. If omitted, uses 4.5s (success) or 9s (error). */
  autoHideMs?: number;
};

const variantStyles: Record<FeedbackVariant, string> = {
  success:
    "border-sky-500/40 bg-slate-900/95 text-slate-100 shadow-sky-500/10 ring-1 ring-sky-500/20",
  error:
    "border-red-500/40 bg-red-950/90 text-red-50 shadow-red-500/10 ring-1 ring-red-500/20",
};

export function FeedbackToast({
  message,
  variant,
  onDismiss,
  autoHideMs: autoHideMsProp,
}: FeedbackToastProps) {
  const autoHideMs =
    autoHideMsProp !== undefined
      ? autoHideMsProp
      : variant === "error"
        ? 9000
        : 4500;

  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!message || autoHideMs <= 0) return;
    const id = window.setTimeout(() => onDismissRef.current(), autoHideMs);
    return () => window.clearTimeout(id);
  }, [message, autoHideMs]);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:p-6"
      role="alert"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${variantStyles[variant]}`}
      >
        <span
          className="mt-0.5 shrink-0 text-lg leading-none"
          aria-hidden
        >
          {variant === "success" ? "✓" : "!"}
        </span>
        <p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-white/10 hover:text-slate-200"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
