import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MemberDetailPage } from "./pages/MemberDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
        <header className="border-b border-slate-800/80 bg-black/30 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-3">
            <Link to="/" className="text-xl font-bold text-sky-400 hover:underline">
              FitMVP
            </Link>
            <span className="text-sm text-slate-500">Member management</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/members/:memberId" element={<MemberDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
