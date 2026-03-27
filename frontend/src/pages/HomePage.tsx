import { useCallback, useEffect, useState } from "react";
import { AddMemberModal } from "../components/members/AddMemberModal";
import { MemberList } from "../components/members/MemberList";
import { MemberSearchBar } from "../components/members/MemberSearchBar";
import { FeedbackToast } from "../components/ui/FeedbackToast";
import { apiRequest } from "../api/client";
import type { Member } from "../api/types";

export function HomePage() {
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const data = await apiRequest<Member[]>(`/members${query}`);
      setMembers(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Could not load members");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadMembers();
    }, 300);
    return () => window.clearTimeout(t);
  }, [loadMembers]);

  return (
    <div className="flex flex-col gap-6">
      <FeedbackToast
        message={listError}
        variant="error"
        onDismiss={() => setListError(null)}
      />

      <section className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
        <div className="mb-4 flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-slate-100">Members</h1>
          <div className="flex w-full min-w-0 items-end gap-3">
            <div className="min-w-0 basis-[70%]">
              <MemberSearchBar value={q} onChange={setQ} />
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="basis-[30%] shrink-0 rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Add member
            </button>
          </div>
        </div>

        <MemberList members={members} loading={loading} />
      </section>

      <AddMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onMemberCreated={loadMembers}
      />
    </div>
  );
}
