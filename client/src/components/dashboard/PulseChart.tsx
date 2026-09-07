import { useId } from "react";

export const PulseChart = ({ values, compact = false, testId = "attendance-chart" }: { values: number[]; compact?: boolean; testId?: string }) => {
  const id = useId().replace(/:/g, "");
  const max = Math.max(...values, 1) * 1.25;
  const width = 700, height = compact ? 80 : 200;
  const points = values.map((value, i) => ({ x: 22 + i / Math.max(values.length - 1, 1) * 650, y: height - 20 - value / max * (height - 35) }));
  const path = points.reduce((d, point, i) => i ? `${d} C ${(points[i - 1].x + point.x) / 2},${points[i - 1].y} ${(points[i - 1].x + point.x) / 2},${point.y} ${point.x},${point.y}` : `M ${point.x},${point.y}`, "");
  const last = points[points.length - 1];
  return <svg data-testid={testId} className={`pulse-chart ${compact ? "compact" : ""}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Weekly attendance: ${values.join(", ")} people`}>
    <defs><linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={compact ? ".08" : ".16"} /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
    {!compact && [0.25, 0.5, 0.75, 1].map(fraction => <line key={fraction} x1="22" x2="680" y1={height - 20 - fraction * (height - 35)} y2={height - 20 - fraction * (height - 35)} stroke="var(--line)" strokeDasharray="3 6" />)}
    <path d={`${path} L ${last.x},${height} L ${points[0].x},${height} Z`} fill={`url(#area-${id})`} />
    <path d={path} fill="none" stroke="var(--accent)" strokeWidth={compact ? 1.7 : 2.5} vectorEffect="non-scaling-stroke" />
    {!compact && points.map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="4" stroke="var(--accent)" strokeWidth="1.5" fill="white"><title>{values[i]} people · week {i + 1}</title></circle>)}
    <circle cx={last.x} cy={last.y} r="8" fill="var(--accent)" opacity=".12" /><circle cx={last.x} cy={last.y} r="3.5" fill="var(--accent)" />
  </svg>;
};

export const PulseRing = ({ score }: { score: number }) => <div className="church-pulse-ring" data-testid="church-pulse-ring">
  <svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="69" fill="none" stroke="var(--accent-soft)" strokeWidth="8" /><circle cx="80" cy="80" r="69" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score / 100 * 433.54} 433.54`} transform="rotate(-90 80 80)" /></svg>
  <div><span data-testid="pulse-label">CHURCH PULSE</span><strong data-testid="pulse-score">{score}</strong><small data-testid="pulse-maximum">of 100</small></div>
</div>;