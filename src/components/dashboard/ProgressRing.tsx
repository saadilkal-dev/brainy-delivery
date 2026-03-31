export function ProgressRing({ value, total, status }: { value: number; total: number; status: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    status === 'on_track' ? 'hsl(var(--success))' :
    status === 'at_risk'  ? 'hsl(var(--primary))' :
                            'hsl(var(--destructive))';

  return (
    <svg width="84" height="84" className="transform -rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
      <circle
        cx="42" cy="42" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="butt"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}
