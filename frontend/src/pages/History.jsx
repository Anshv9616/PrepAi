import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { fetchHistoryThunk } from "../store/slices/interviewSlice";

export default function History() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, loading } = useSelector((s) => s.interview);

  useEffect(() => { dispatch(fetchHistoryThunk()); }, []);

  const scoreColor = (score) =>
    score >= 7 ? "text-green-400 bg-green-500/10 border-green-500/20" :
    score >= 4 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="fixed top-0 right-0 w-[350px] h-[350px] bg-blue-500/4 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-white">History</h1>
            <p className="text-white/40 text-sm mt-1">All your past interview sessions</p>
          </div>
          <button onClick={() => navigate("/interview")}
            className="btn-shine px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm">
            + New Session
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-border flex items-center justify-center text-2xl text-white/20">◷</div>
            <p className="text-white/30 text-sm">No sessions yet</p>
            <button onClick={() => navigate("/interview")}
              className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all">
              Start First Interview
            </button>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="glass rounded-2xl overflow-x-auto animate-fade-up stagger-1">
            <div className="min-w-[700px]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_80px_100px_110px_80px] gap-4 px-5 py-3 border-b border-border bg-bg-3/30">
              {["Topic", "Date", "Progress", "Score", "Status", ""].map((h) => (
                <p key={h} className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">{h}</p>
              ))}
            </div>

            {/* Rows */}
            {history.map((s, i) => (
              <div key={s.session_id}
                className={`grid grid-cols-[1fr_120px_80px_100px_110px_80px] gap-4 px-5 py-4 items-center border-b border-border/50 hover:bg-white/3 transition-all duration-200 cursor-pointer animate-fade-up stagger-${(i % 5) + 1} group`}
                onClick={() => navigate(`/session/${s.session_id}`)}>
                <p className="text-sm font-semibold text-white group-hover:text-accent-light transition-colors">{s.topic}</p>
                <p className="text-sm text-white/40">{s.date 
  ? new Date(s.date).toLocaleDateString() 
  : new Date().toLocaleDateString()}</p>
                <p className="text-sm text-white/40 font-mono">{s.progress}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border w-fit ${scoreColor(s.avg_score)}`}>
                  {s.avg_score}/10
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border w-fit ${s.is_completed ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                  {s.is_completed ? "Completed" : "In Progress"}
                </span>
                <span className="text-white/20 group-hover:text-white/50 transition-colors text-sm">→</span>
              </div>
            ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
