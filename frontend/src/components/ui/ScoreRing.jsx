export default function ScoreRing({ score, size = 80 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  const color = score >= 7 ? "#4ade80" : score >= 4 ? "#fbbf24" : "#f87171";
  const glow = score >= 7 ? "rgba(74,222,128,0.4)" : score >= 4 ? "rgba(251,191,36,0.4)" : "rgba(248,113,113,0.4)";
  return (
    <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ring-track, rgba(255,255,255,0.08))" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}/>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.27} fontWeight="700" fontFamily="'Plus Jakarta Sans'">
        {score}
      </text>
    </svg>
  );
}
