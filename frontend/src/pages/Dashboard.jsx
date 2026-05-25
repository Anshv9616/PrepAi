import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import ScoreRing from "../components/ui/ScoreRing";
import { fetchHistoryThunk, fetchStatsThunk } from "../store/slices/interviewSlice";
import { fetchResumeThunk } from "../store/slices/resumeSlice";

const actions = [
  { icon: "◎", label: "Start Interview", desc: "AI questions from your resume", path: "/interview", color: "from-accent/20 to-accent/5", border: "border-accent/20" },
  { icon: "◧", label: "Resume Tools", desc: "JD match, cover letter, LinkedIn", path: "/resume", color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20" },
  { icon: "◷", label: "History", desc: "Review past sessions", path: "/history", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20" },
  { icon: "◈", label: "Analytics", desc: "Performance breakdown", path: "/stats", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20" },
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, stats } = useSelector((s) => s.interview);
  const { resume } = useSelector((s) => s.resume);

  useEffect(() => {
    dispatch(fetchHistoryThunk());
    dispatch(fetchStatsThunk());
    dispatch(fetchResumeThunk());
  }, []);

  const avgScore = stats.length
    ? (stats.reduce((a, s) => a + parseFloat(s.average_score || 0), 0) / stats.length).toFixed(1) : null;

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 max-w-full overflow-x-hidden">
        {/* Ambient glow */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">Your interview prep overview</p>
          </div>
          <button onClick={() => navigate("/interview")}
            className="btn-shine px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm flex items-center gap-2">
            <span>+</span> New Session
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Avg Score", value: avgScore ?? "—", unit: "/10", delay: "stagger-1" },
            { label: "Sessions", value: history.length, delay: "stagger-2" },
            { label: "Topics", value: stats.length, delay: "stagger-3" },
            { label: "Resume", value: resume?.content ? "Ready" : "Missing", sm: true, delay: "stagger-4" },
          ].map((s) => (
            <div key={s.label} className={`glass rounded-2xl p-5 animate-fade-up ${s.delay} gradient-border card-hover`}>
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`font-bold text-white ${s.sm ? "text-lg" : "text-3xl"}`}>
                {s.value}{s.unit && <span className="text-base text-white/30 font-normal">{s.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Action grid */}
        <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {actions.map((a, i) => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className={`animate-fade-up stagger-${i + 1} text-left p-5 rounded-2xl bg-gradient-to-br ${a.color} border ${a.border} card-hover transition-all duration-200 group`}>
              <span className="text-2xl block mb-3 text-white/60 group-hover:text-white transition-colors">{a.icon}</span>
              <p className="font-bold text-sm text-white mb-1">{a.label}</p>
              <p className="text-xs text-white/35">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Stats row */}
        {stats.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Topic Performance</p>
            <div className="flex gap-3 flex-wrap mb-8">
              {stats.map((s, i) => (
                <div key={s.topic} className={`glass rounded-2xl p-4 flex items-center gap-4 animate-fade-up stagger-${(i % 6) + 1}`}>
                  <ScoreRing score={Math.round(parseFloat(s.average_score))} size={56} />
                  <div>
                    <p className="text-sm font-semibold text-white">{s.topic}</p>
                    <p className="text-xs text-white/30">{s.total_questions} questions</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recent sessions */}
        {history.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Recent Sessions</p>
            <div className="flex flex-col gap-2">
              {history.slice(0, 5).map((s, i) => (
                <div key={s.session_id} onClick={() => navigate(`/session/${s.session_id}`)}
                  className={`glass rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer card-hover animate-fade-up stagger-${(i % 6) + 1} group`}>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-accent-light transition-colors">{s.topic}</p>
                    <p className="text-xs text-white/30 mt-0.5">{s.date ? new Date(s.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30">{s.progress}</span>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.is_completed ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                      {s.is_completed ? "Done" : "In Progress"}
                    </span>
                    <span className={`text-sm font-bold ${parseFloat(s.avg_score) >= 7 ? "text-green-400" : parseFloat(s.avg_score) >= 4 ? "text-amber-400" : "text-red-400"}`}>
                      {s.avg_score}/10
                    </span>
                    <span className="text-white/20 group-hover:text-white/50 transition-colors">→</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
