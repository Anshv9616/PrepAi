import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { generateQuestionsThunk } from "../store/slices/interviewSlice";

const TOPICS = ["General", "Projects", "Core Subjects", "Internship"];

export default function Interview() {
  const [topic, setTopic] = useState("General");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.interview);

  const handleGenerate = async () => {
    const res = await dispatch(generateQuestionsThunk(topic));
    if (!res.error) navigate(`/session/${res.payload.session_id}`);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-white">New Interview</h1>
          <p className="text-white/40 text-sm mt-1">Pick a topic — we'll generate 10 questions from your resume</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 max-w-4xl animate-fade-up stagger-1">
          {/* Setup card */}
          <div className="glass rounded-2xl p-6 gradient-border">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">Select Topic</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {TOPICS.map((t) => (
                <button key={t} onClick={() => setTopic(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    topic === t
                      ? "bg-accent/20 border-accent/40 text-accent-light shadow-glow-sm"
                      : "bg-white/4 border-border-2 text-white/40 hover:text-white/70 hover:border-border-3"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-bg-4/50 rounded-xl p-4 mb-5 flex flex-col gap-2">
              {[["Questions", "10"], ["Format", "Audio answer"], ["Based on", "Your resume"], ["Topic", topic]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/35">{k}</span>
                  <span className={`font-medium ${k === "Topic" ? "text-accent-light" : "text-white/70"}`}>{v}</span>
                </div>
              ))}
            </div>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

            <button onClick={handleGenerate} disabled={loading}
              className="btn-shine w-full py-3.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-all duration-200 shadow-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
              ) : `Start ${topic} Interview →`}
            </button>
          </div>

          {/* Tips */}
          <div className="glass rounded-2xl p-5 h-fit animate-fade-up stagger-2">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">Tips</p>
            <ul className="flex flex-col gap-3">
              {[
                "Upload your resume first",
                "Speak clearly and in full sentences",
                "Explain the why, not just the what",
                "Mention specific tools and trade-offs",
                "Aim for 30–90 second answers",
              ].map((tip, i) => (
                <li key={i} className={`flex items-start gap-2.5 text-sm text-white/40 animate-fade-up stagger-${i + 1}`}>
                  <span className="text-accent-light mt-0.5 shrink-0">✦</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
