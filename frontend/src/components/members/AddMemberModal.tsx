import { useEffect, useId, useState } from "react";
import { apiRequest } from "../../api/client";
import type { Member } from "../../api/types";
import { validateEmailField } from "../../utils/email";

type AddMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onMemberCreated: () => void | Promise<void>;
};

export function AddMemberModal({ open, onClose, onMemberCreated }: AddMemberModalProps) {
  const titleId = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emailValidation = validateEmailField(email);
    if (!emailValidation.ok) {
      setError(emailValidation.message);
      return;
    }
    const emailNormalized = email.trim();
    setSaving(true);
    try {
      await apiRequest<Member>("/members", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: emailNormalized,
        }),
      });
      await Promise.resolve(onMemberCreated());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        disabled={saving}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm disabled:cursor-not-allowed"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-slate-100">
            New member
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm text-slate-400">
            First name
            <input
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
              required
              autoComplete="given-name"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-400">
            Last name
            <input
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Doe"
              required
              autoComplete="family-name"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-400">
            Email
            <input
              type="email"
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.doe@email.com"
              required
              autoComplete="email"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
