import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/layout/Sidebar";
import ScoreRing from "../components/ui/ScoreRing";
import { fetchStatsThunk } from "../store/slices/interviewSlice";

export default function Stats() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((s) => s.interview);

  useEffect(() => { dispatch(fetchStatsThunk()); }, []);

  const overall = stats.length
    ? (stats.reduce((a, s) => a + parseFloat(s.average_score || 0), 0) / stats.length).toFixed(1) : 0;
  const total = stats.reduce((a, s) => a + (s.total_questions || 0), 0);
  const weak = stats.filter((s) => parseFloat(s.average_score) < 5);
  const strong = stats.filter((s) => parseFloat(s.average_score) >= 7);

  const levelLabel = (score) => score >= 7 ? "Strong" : score >= 4 ? "Average" : "Needs Work";
  const levelClass = (score) =>
    score >= 7 ? "text-green-400 bg-green-500/10 border-green-500/20" :
    score >= 4 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="fixed top-0 left-1/2 w-[500px] h-[300px] bg-emerald-500/4 rounded-full blur-[120px] pointer-events-none" />

        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Your performance across all topics</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!loading && stats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30 text-sm animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-border flex items-center justify-center text-2xl">◈</div>
            <p>Complete some sessions to see analytics</p>
          </div>
        )}

        {!loading && stats.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Overall Avg", value: overall, unit: "/10", delay: "stagger-1" },
                { label: "Topics", value: stats.length, delay: "stagger-2" },
                { label: "Questions", value: total, delay: "stagger-3" },
                { label: "Weak Topics", value: weak.length, color: weak.length > 0 ? "text-red-400" : "text-green-400", delay: "stagger-4" },
              ].map((s) => (
                <div key={s.label} className={`glass rounded-2xl p-5 animate-fade-up ${s.delay} gradient-border`}>
                  <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color || "text-white"}`}>
                    {s.value}{s.unit && <span className="text-base text-white/25 font-normal">{s.unit}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Topic breakdown */}
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">By Topic</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {stats.map((s, i) => {
                const score = Math.round(parseFloat(s.average_score));
                return (
                  <div key={s.topic} className={`glass rounded-2xl p-5 flex items-center gap-4 animate-fade-up stagger-${(i % 6) + 1} card-hover`}>
                    <ScoreRing score={score} size={68} />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{s.topic}</p>
                      <p className="text-xs text-white/30">{s.total_questions} questions</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit ${levelClass(score)}`}>
                        {levelLabel(score)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar chart */}
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Score Breakdown</p>
            <div className="glass rounded-2xl p-6 flex flex-col gap-4 mb-6 animate-fade-up">
              {stats.map((s, i) => {
                const score = parseFloat(s.average_score);
                const pct = (score / 10) * 100;
                const barColor = score >= 7 ? "from-green-500 to-emerald-400" : score >= 4 ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";
                return (
                  <div key={s.topic} className={`flex items-center gap-4 animate-fade-up stagger-${(i % 6) + 1}`}>
                    <p className="text-sm text-white/60 w-28 shrink-0 truncate">{s.topic}</p>
                    <div className="flex-1 h-2 bg-bg-4 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-sm font-bold text-white/60 w-10 text-right font-mono">{score.toFixed(1)}</p>
                  </div>
                );
              })}
            </div>

            {/* Callouts */}
            {weak.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-500/6 border border-red-500/15 mb-3 animate-fade-up">
                <p className="text-sm text-white/70">
                  <span className="font-bold text-red-400">⚠ Focus areas: </span>
                  You scored below 5 in <span className="text-red-400 font-semibold">{weak.map((t) => t.topic).join(", ")}</span>. Practice these next.
                </p>
              </div>
            )}
            {strong.length > 0 && (
              <div className="p-4 rounded-2xl bg-green-500/6 border border-green-500/15 animate-fade-up">
                <p className="text-sm text-white/70">
                  <span className="font-bold text-green-400">✓ Strong areas: </span>
                  You scored 7+ in <span className="text-green-400 font-semibold">{strong.map((t) => t.topic).join(", ")}</span>.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
