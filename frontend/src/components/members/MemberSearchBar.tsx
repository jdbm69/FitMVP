type MemberSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MemberSearchBar({ value, onChange }: MemberSearchBarProps) {
  return (
    <label className="flex min-w-0 w-full flex-col gap-1 text-sm text-slate-400">
      Search
      <input
        type="search"
        placeholder="First name, last name, or email"
        className="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-500/50 focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
