import { AlertTriangle, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import { BRANCHES, MEMBERS, TODAY, consecutiveMisses, fmtDate } from "@/data/demo";

const WEEKS = 12;
const weekLabel = (i: number) => { const d = new Date(TODAY); d.setDate(d.getDate() - (WEEKS - 1 - i) * 7); return fmtDate(d); };

export function AttendanceHeatmap() {
  const rows = BRANCHES.map(branch => {
    const list = MEMBERS.filter(m => m.branch === branch);
    return { branch, cells: Array.from({ length: WEEKS }, (_, w) => list.filter(m => m.attendance[w]).length / Math.max(1, list.length)), size: list.length };
  });
  const all = rows.flatMap(r => r.cells); const lo = Math.min(...all); const hi = Math.max(...all);
  const norm = (v: number) => hi === lo ? 1 : (v - lo) / (hi - lo);
  return <div className="panel heatmap-panel" data-testid="attendance-heatmap">
    <div className="panel-heading"><div><div className="eyebrow">12-WEEK RHYTHM</div><h2>Attendance heat-map by branch</h2></div><div className="heat-legend"><span>Low</span><i style={{ opacity: .15 }} /><i style={{ opacity: .4 }} /><i style={{ opacity: .7 }} /><i /><span>High</span></div></div>
    <div className="heatmap">
      {rows.map(r => <div className="heat-row" key={r.branch}><span className="heat-label">{r.branch}<em>{r.size} people</em></span>{r.cells.map((v, i) => <i key={i} className="heat-cell" style={{ opacity: .1 + norm(v) * .9 }} title={`${r.branch} · week of ${weekLabel(i)} · ${Math.round(v * 100)}%`} />)}</div>)}
      <div className="heat-axis"><span /><span>{weekLabel(0)}</span><span>{weekLabel(5)}</span><span>{weekLabel(11)}</span></div>
    </div>
  </div>;
}

export function RetentionAlerts({ onOpenMember }: { onOpenMember: (id: number) => void }) {
  const flagged = MEMBERS.filter(m => m.status !== "Visitor").map(m => ({ m, misses: consecutiveMisses(m.attendance) })).filter(x => x.misses >= 3).sort((a, b) => b.misses - a.misses);
  return <div className="panel alerts-panel" data-testid="retention-alerts">
    <div className="panel-heading"><div><div className="eyebrow">RETENTION ALERTS</div><h2>Missed 3+ Sundays <span className="count-pill warm">{flagged.length}</span></h2></div><AlertTriangle size={18} className="warm-text" /></div>
    <div className="attention-list">
      {flagged.slice(0, 6).map(({ m, misses }) => <div className="attention-row" key={m.id}>
        <Avatar initials={m.initials} tone={m.tone} />
        <div className="person-info"><strong>{m.name}</strong><span>{m.branch} · last seen {fmtDate(m.lastAttendance)}</span></div>
        <span className="miss-pill">{misses >= 12 ? "12+" : misses} wks</span>
        <button className="row-action" data-testid={`reach-out-${m.id}`} onClick={() => onOpenMember(m.id)}><PhoneCall size={12} />Reach out</button>
      </div>)}
    </div>
    {flagged.length > 6 && <button className="text-button" onClick={() => toast.info(`${flagged.length} people flagged`, { description: "Open People and filter by 'Absent 4+ weeks'." })}>View all {flagged.length}</button>}
  </div>;
}
