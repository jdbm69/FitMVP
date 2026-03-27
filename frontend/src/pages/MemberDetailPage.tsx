import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { CheckIn, MemberSummary, Membership, Plan } from "../api/types";
import { FeedbackToast, type FeedbackVariant } from "../components/ui/FeedbackToast";

type FeedbackState = { message: string; variant: FeedbackVariant } | null;

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string {
  return new Date(local).toISOString();
}

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [planId, setPlanId] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState(() =>
    toLocalDatetimeValue(new Date().toISOString()),
  );
  const [effectiveLocal, setEffectiveLocal] = useState(() =>
    toLocalDatetimeValue(new Date().toISOString()),
  );
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        apiRequest<MemberSummary>(`/members/${memberId}/summary`),
        apiRequest<Plan[]>(`/plans`),
      ]);
      setSummary(s);
      setPlans(p);
      setPlanId((prev) => prev || p[0]?.id || "");
    } catch (e) {
      setFeedback({
        message: e instanceof Error ? e.message : "Failed to load",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    setFeedback(null);
  }, [memberId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function assignMembership() {
    if (!memberId || !planId) return;
    setBusy(true);
    setFeedback(null);
    try {
      await apiRequest<Membership>(`/members/${memberId}/memberships`, {
        method: "POST",
        body: JSON.stringify({
          planId,
          startsAt: localToIso(startsAtLocal),
        }),
      });
      setFeedback({ message: "Membership assigned.", variant: "success" });
      await loadAll();
    } catch (e) {
      setFeedback({
        message: e instanceof Error ? e.message : "Error",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function cancelMembership() {
    if (!memberId || !summary?.activeMembership) return;
    setBusy(true);
    setFeedback(null);
    try {
      await apiRequest<Membership>(
        `/members/${memberId}/memberships/${summary.activeMembership.membershipId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            effectiveDate: localToIso(effectiveLocal),
          }),
        },
      );
      setFeedback({ message: "Membership cancelled.", variant: "success" });
      await loadAll();
    } catch (e) {
      setFeedback({
        message: e instanceof Error ? e.message : "Error",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    if (!memberId) return;
    setBusy(true);
    setFeedback(null);
    try {
      await apiRequest<CheckIn>(`/members/${memberId}/check-ins`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setFeedback({ message: "Check-in recorded.", variant: "success" });
      await loadAll();
    } catch (e) {
      setFeedback({
        message: e instanceof Error ? e.message : "Error",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!memberId) {
    return <p className="text-slate-500">Invalid ID.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <FeedbackToast
        message={feedback?.message ?? null}
        variant={feedback?.variant ?? "success"}
        onDismiss={() => setFeedback(null)}
      />

      <p>
        <Link to="/" className="text-sm text-sky-400 hover:underline">
          ← Back to list
        </Link>
      </p>

      {loading || !summary ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <>
          <section className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">Summary</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Member</dt>
              <dd className="break-all font-mono text-xs text-slate-300">{summary.memberId}</dd>
              <dt className="text-slate-500">Active membership</dt>
              <dd>
                {summary.activeMembership ? (
                  <>
                    <strong className="text-slate-100">{summary.activeMembership.planName}</strong>
                    <br />
                    <span className="text-xs text-slate-500">
                      Since {new Date(summary.activeMembership.startsAt).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </dd>
              <dt className="text-slate-500">Last check-in</dt>
              <dd className="text-slate-300">
                {summary.lastCheckInAt
                  ? new Date(summary.lastCheckInAt).toLocaleString()
                  : "—"}
              </dd>
              <dt className="text-slate-500">Check-ins (30 days)</dt>
              <dd className="text-slate-300">{summary.checkInsLast30Days}</dd>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <h3 className="mb-3 text-base font-semibold text-slate-100">Assign membership</h3>
            {summary.activeMembership ? (
              <p className="text-sm leading-relaxed text-slate-400">
                This member already has an active membership (
                <span className="font-medium text-slate-300">
                  {summary.activeMembership.planName}
                </span>
                ). Cancel the current membership if you need to assign another one.
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1 text-sm text-slate-400">
                  Plan
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    disabled={!plans.length}
                    className="min-w-[200px] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${(p.priceCents / 100).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-400">
                  Inicio
                  <input
                    type="datetime-local"
                    value={startsAtLocal}
                    onChange={(e) => setStartsAtLocal(e.target.value)}
                    className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void assignMembership()}
                  disabled={busy}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <h3 className="mb-3 text-base font-semibold text-slate-100">Cancel membership</h3>
            {summary.activeMembership ? (
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1 text-sm text-slate-400">
                  Effective date
                  <input
                    type="datetime-local"
                    value={effectiveLocal}
                    onChange={(e) => setEffectiveLocal(e.target.value)}
                    className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void cancelMembership()}
                  disabled={busy}
                  className="rounded-lg border border-red-700/80 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  Cancel membership
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active membership.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <h3 className="mb-2 text-base font-semibold text-slate-100">Check-in</h3>
            {summary.activeMembership ? (
              <>
                <p className="mb-3 text-xs text-slate-500">
                  Record an attendance for this member.
                </p>
                <button
                  type="button"
                  onClick={() => void checkIn()}
                  disabled={busy}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
                >
                  Record check-in
                </button>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-slate-400">
                You cannot record a check-in without an active membership. Assign a plan first, or wait
                until an existing membership becomes active.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
