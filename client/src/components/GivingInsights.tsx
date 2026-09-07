import { ArrowDownRight, ArrowUpRight, Target } from "lucide-react";
import { FUND_TRENDS, PLEDGES, TREND_MONTHS, zar } from "@/data/demo";

const FUND_COLORS: Record<string, string> = { Tithe: "#c9a961", Offering: "#7fb69a", "Building project": "#7ea6c9", Missions: "#d9a35a", Benevolence: "#d07a72" };

export default function GivingInsights() {
  const funds = Object.entries(FUND_TRENDS).map(([name, series]) => { const last = series[series.length - 1]; const prev = series[series.length - 2]; return { name, series, last, delta: ((last - prev) / prev) * 100, max: Math.max(...series) }; });
  const totalNow = funds.reduce((s, f) => s + f.last, 0);
  const ranked = [...funds].sort((a, b) => b.last - a.last);

  return <>
    <div className="fund-grid" data-testid="giving-fund-trends">
      {funds.map(f => <div className="fund-card" key={f.name}>
        <div className="fund-top"><span className="fund-dot" style={{ background: FUND_COLORS[f.name] }} /><span className="fund-name">{f.name}</span><span className={`metric-change ${f.delta >= 0 ? "up" : "down"}`}>{f.delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(f.delta).toFixed(1)}%</span></div>
        <strong className="fund-value">R{f.last.toFixed(2)}M</strong>
        <div className="sparkline">{f.series.map((v, i) => <i key={i} style={{ height: `${(v / f.max) * 100}%`, background: FUND_COLORS[f.name], opacity: i === f.series.length - 1 ? 1 : .35 }} title={`${TREND_MONTHS[i]} · R${v.toFixed(2)}M`} />)}</div>
        <div className="chart-axis"><span>{TREND_MONTHS[0]}</span><span>{TREND_MONTHS[TREND_MONTHS.length - 1]}</span></div>
      </div>)}
    </div>

    <div className="dashboard-grid top-grid">
      <div className="panel" data-testid="giving-top-funds">
        <div className="panel-heading"><div><div className="eyebrow">TOP FUNDS · JUNE</div><h2>Where giving is flowing</h2></div><strong className="gold-text">R{totalNow.toFixed(2)}M</strong></div>
        <div className="rank-list">{ranked.map((f, i) => <div className="rank-row" key={f.name}><span className="rank-index">{String(i + 1).padStart(2, "0")}</span><div className="rank-body"><div className="rank-head"><strong>{f.name}</strong><span>{Math.round((f.last / totalNow) * 100)}% · R{f.last.toFixed(2)}M</span></div><div className="rank-track"><div style={{ width: `${(f.last / ranked[0].last) * 100}%`, background: FUND_COLORS[f.name] }} /></div></div></div>)}</div>
      </div>
      <div className="panel" data-testid="giving-pledges">
        <div className="panel-heading"><div><div className="eyebrow">PLEDGE TRACKING</div><h2>Commitments in progress</h2></div><Target size={18} className="gold-text" /></div>
        <div className="pledge-list">{PLEDGES.map(p => { const pct = Math.round((p.received / p.pledged) * 100); return <div className="pledge-row" key={p.id}><div className="rank-head"><strong>{p.name}</strong><span>{p.donors} donors · due {p.due}</span></div><div className="pledge-amounts"><strong>{zar(p.received)}</strong><span>of {zar(p.pledged)}</span><b>{pct}%</b></div><div className="rank-track"><div style={{ width: `${pct}%` }} /></div></div>; })}</div>
      </div>
    </div>
  </>;
}
