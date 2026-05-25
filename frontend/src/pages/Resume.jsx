import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/layout/Sidebar";
import { clearResults } from "../store/slices/resumeSlice";
import {
  uploadResumeThunk,
  fetchResumeThunk,
  matchJDThunk,
  coverLetterThunk,
  linkedinBioThunk,
} from "../store/slices/resumeSlice";
import toast from "react-hot-toast";
const TABS = ["Upload", "JD Match", "Cover Letter", "LinkedIn Bio"];

export default function Resume() {
  const [tab, setTab] = useState("Upload");
  const [jd, setJd] = useState("");
  const [clJd, setClJd] = useState("");
  const dispatch = useDispatch();
  const {
    resume, uploadMsg, matchResult, coverLetter, linkedinBio,
    loading, matchLoading, coverLoading, linkedinLoading, error,
  } = useSelector((s) => s.resume);

  useEffect(() => { dispatch(fetchResumeThunk()); }, []);
  useEffect(() => {
  dispatch(fetchResumeThunk());
  return () => dispatch(clearResults()); // cleanup on unmount
}, []);
  const handleTabChange = (t) => {
  setTab(t);
  dispatch(clearResults()); 
};
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-white">Resume Tools</h1>
            <p className="text-white/40 text-sm mt-1">AI-powered career tools from your resume</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${resume?.content ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
            {resume?.content ? "✓ Resume loaded" : "⚠ No resume"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-bg-3/50 border border-border rounded-xl p-1 w-fit mb-7 animate-fade-up stagger-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t ? "bg-bg-5 text-white border border-border-2" : "text-white/35 hover:text-white/60"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="max-w-2xl animate-fade-up stagger-2">

          {/* ── Upload ── */}
          {tab === "Upload" && (
            <div className="flex flex-col gap-5">
              <div className="glass rounded-2xl p-8 border-2 border-dashed border-border-2 flex flex-col items-center text-center gap-4 hover:border-accent/30 transition-colors duration-300">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl text-accent-light animate-float">
                  ◧
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{resume?.content ? "Resume uploaded" : "Upload your resume"}</h3>
                  <p className="text-white/35 text-sm mt-1">PDF only — previous resume will be replaced</p>
                </div>
                <label className="btn-shine cursor-pointer px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : resume?.content ? "Replace PDF" : "Choose PDF"}
                  <input type="file" accept=".pdf" onChange={(e) => { if (e.target.files[0]) dispatch(uploadResumeThunk(e.target.files[0])); }} disabled={loading} className="hidden" />
                </label>
                {uploadMsg && (
                  <p className={`text-sm ${uploadMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{uploadMsg}</p>
                )}
                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>

              {resume?.content && (
                <div className="glass rounded-2xl p-5">
                  <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-3">Preview</p>
                  <pre className="font-mono text-[11.5px] text-white/30 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {resume.content.slice(0, 800)}...
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ── JD Match ── */}
          {tab === "JD Match" && (
            <div className="flex flex-col gap-5">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1">Job Description Matcher</h3>
                <p className="text-sm text-white/35 mb-4">See how well your resume fits a role</p>
                <textarea value={jd} onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={7}
                  className="w-full bg-bg-4/60 border border-border-2 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-accent/50 transition-all resize-none mb-4" />
                <button onClick={() => dispatch(matchJDThunk(jd))} disabled={matchLoading || !jd.trim()}
                  className="btn-shine px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {matchLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</> : "Match Resume →"}
                </button>
              </div>

              {matchResult && !matchResult.error && (
                <div className="glass rounded-2xl p-6 flex flex-col gap-5 animate-fade-up">
                  {/* Score */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <svg viewBox="0 0 100 100" width="110" height="110" style={{ filter: `drop-shadow(0 0 12px ${matchResult.match_score >= 70 ? "rgba(74,222,128,0.4)" : matchResult.match_score >= 40 ? "rgba(251,191,36,0.4)" : "rgba(248,113,113,0.4)"})` }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                        <circle cx="50" cy="50" r="40" fill="none"
                          stroke={matchResult.match_score >= 70 ? "#4ade80" : matchResult.match_score >= 40 ? "#fbbf24" : "#f87171"}
                          strokeWidth="8"
                          strokeDasharray={`${matchResult.match_score * 2.513} 251.3`}
                          strokeLinecap="round" transform="rotate(-90 50 50)"
                          style={{ transition: "stroke-dasharray 1s ease" }}/>
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                          fill="white" fontSize="20" fontWeight="700">{matchResult.match_score}%</text>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold mb-1">Match Score</p>
                      <p className="text-white/70 text-sm leading-relaxed">{matchResult.suggestions}</p>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-green-400 mb-2">✓ Matched Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.matched_skills.map((s) => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-400 mb-2">✗ Missing Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.missing_skills.map((s) => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cover Letter ── */}
          {tab === "Cover Letter" && (
            <div className="flex flex-col gap-5">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1">Cover Letter Generator</h3>
                <p className="text-sm text-white/35 mb-4">Personalized letter from your resume + job description</p>
                <textarea value={clJd} onChange={(e) => setClJd(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="w-full bg-bg-4/60 border border-border-2 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-accent/50 transition-all resize-none mb-4" />
                <button onClick={() => dispatch(coverLetterThunk(clJd))} disabled={coverLoading || !clJd.trim()}
                  className="btn-shine px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {coverLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : "Generate Cover Letter →"}
                </button>
              </div>

              {coverLetter && !coverLetter.error && (
                <div className="glass rounded-2xl p-6 flex flex-col gap-4 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white/60">Cover Letter</h4>
                    <button onClick={() => {navigator.clipboard.writeText(coverLetter.cover_letter); toast.success("Copied to clipboard!");}}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-border-2 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all">
                      Copy
                    </button>
                  </div>
                  <pre className="font-mono text-[12.5px] text-white/60 whitespace-pre-wrap leading-loose bg-bg-4/40 rounded-xl p-4 max-h-72 overflow-y-auto">
                    {coverLetter.cover_letter}
                  </pre>
                  <div className="flex flex-wrap gap-1.5">
                    {coverLetter.key_points_highlighted?.map((p) => (
                      <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LinkedIn Bio ── */}
          {tab === "LinkedIn Bio" && (
            <div className="flex flex-col gap-5">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1">LinkedIn Bio Generator</h3>
                <p className="text-sm text-white/35 mb-4">Professional summary generated from your resume</p>
                <button onClick={() => dispatch(linkedinBioThunk())} disabled={linkedinLoading}
                  className="btn-shine px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {linkedinLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : "Generate Bio →"}
                </button>
              </div>

              {linkedinBio && !linkedinBio.error && (
                <div className="glass rounded-2xl p-6 flex flex-col gap-4 animate-fade-up">
                  <div className="bg-accent/8 border border-accent/20 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-accent-light uppercase tracking-widest block mb-2">Headline</span>
                    <p className="text-white font-bold text-base">{linkedinBio.headline}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white/60">Bio</h4>
                    <button onClick={() =>{ navigator.clipboard.writeText(linkedinBio.bio); toast.success("Copied to clipboard!");}}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-border-2 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all">
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{linkedinBio.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedinBio.top_skills?.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
