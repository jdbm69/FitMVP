import { Link } from "react-router-dom";
import type { Member } from "../../api/types";

type MemberListProps = {
  members: Member[];
  loading: boolean;
};

export function MemberList({ members, loading }: MemberListProps) {
  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }

  if (members.length === 0) {
    return <p className="text-slate-500">No results.</p>;
  }

  return (
    <ul className="divide-y divide-slate-700/80">
      {members.map((m) => (
        <li key={m.id}>
          <Link
            to={`/members/${m.id}`}
            className={`block rounded-lg py-3 pl-3 transition hover:bg-sky-500/10 ${
              m.hasActiveMembership
                ? "border-l-4 border-l-emerald-500/90 bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/25"
                : ""
            }`}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="block font-medium text-slate-100">
                {m.firstName} {m.lastName}
              </span>
              {m.hasActiveMembership ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  Active membership
                </span>
              ) : null}
            </span>
            <span className="block text-sm text-slate-400">{m.email}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
