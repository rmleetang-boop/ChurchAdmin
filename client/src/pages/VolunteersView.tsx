import { useState } from "react";
import { BellRing, Check, RefreshCw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import { MEMBERS, SERVING_TEAMS, fmtDate, nextSundays } from "@/data/demo";

type Slot = { team: string; date: string; member: { id: number; name: string; initials: string; tone: string }; role: string; confirmed: boolean };

const roster = SERVING_TEAMS.map((team, t) => ({ ...team, people: MEMBERS.filter(m => m.status === "Active" && m.id % SERVING_TEAMS.length === t).slice(0, 7) }));
const sundays = nextSundays(4);
const initialSlots: Slot[] = roster.flatMap((team, t) => sundays.map((d, s) => { const p = team.people[(s + t) % team.people.length]; return { team: team.name, date: d.toISOString(), member: { id: p.id, name: p.name, initials: p.initials, tone: p.tone }, role: team.roles[(s + t) % team.roles.length], confirmed: (s + t) % 3 !== 1 }; }));

export default function VolunteersView() {
  const [slots, setSlots] = useState(initialSlots);
  const [activeTeam, setActiveTeam] = useState<string>("All");
  const pending = slots.filter(s => !s.confirmed).length;
  const visible = activeTeam === "All" ? roster : roster.filter(r => r.name === activeTeam);

  const confirm = (slot: Slot) => { setSlots(cur => cur.map(s => s === slot ? { ...s, confirmed: true } : s)); toast.success("Serving confirmed", { description: `${slot.member.name} · ${slot.team} · ${fmtDate(slot.date)}` }); };
  const swap = (slot: Slot) => { const team = roster.find(r => r.name === slot.team)!; const next = team.people[(team.people.findIndex(p => p.id === slot.member.id) + 1) % team.people.length]; setSlots(cur => cur.map(s => s === slot ? { ...s, member: { id: next.id, name: next.name, initials: next.initials, tone: next.tone }, confirmed: false } : s)); toast.info("Swap requested", { description: `${next.name} asked to cover ${slot.role}.` }); };

  return <>
    <div className="summary-strip"><div><span className="summary-label">Volunteers</span><strong>{roster.reduce((s, r) => s + r.people.length, 0)}</strong></div><div><span className="summary-label">Serving teams</span><strong>{roster.length}</strong></div><div><span className="summary-label">Awaiting confirmation</span><strong className="text-warm">{pending}</strong></div></div>

    <div className="care-inbox-toolbar"><div><button className={`filter-chip ${activeTeam === "All" ? "active" : ""}`} onClick={() => setActiveTeam("All")}>All teams</button>{roster.map(r => <button key={r.name} data-testid={`team-chip-${r.name}`} className={`filter-chip ${activeTeam === r.name ? "active" : ""}`} onClick={() => setActiveTeam(r.name)}><i className="fund-dot" style={{ background: r.color }} />{r.name}</button>)}</div><button className="button button-ghost" onClick={() => toast.success("Reminders sent", { description: `${pending} volunteers nudged on WhatsApp.` })}><BellRing size={14} />Remind unconfirmed</button></div>

    <div className="panel table-panel schedule-panel" data-testid="serving-schedule">
      <div className="panel-heading"><div><div className="eyebrow">SERVING SCHEDULE</div><h2>Next four Sundays</h2></div></div>
      <div className="schedule-grid" style={{ gridTemplateColumns: `160px repeat(${sundays.length}, 1fr)` }}>
        <span className="schedule-corner">Team</span>
        {sundays.map(d => <span className="schedule-date" key={d.toISOString()}>{fmtDate(d, { weekday: "short", day: "numeric", month: "short" })}</span>)}
        {visible.map(team => <div className="schedule-row" key={team.name} style={{ display: "contents" }}>
          <span className="schedule-team"><i className="fund-dot" style={{ background: team.color }} />{team.name}</span>
          {sundays.map(d => { const slot = slots.find(s => s.team === team.name && s.date === d.toISOString())!; return <div className={`schedule-cell ${slot.confirmed ? "ok" : "pending"}`} key={d.toISOString()} data-testid={`slot-${team.name}-${d.getDate()}`}>
            <Avatar initials={slot.member.initials} tone={slot.member.tone} small />
            <div className="person-info"><strong>{slot.member.name}</strong><span>{slot.role}</span></div>
            <div className="schedule-actions">{slot.confirmed ? <span className="status-badge status-green"><Check size={11} />Confirmed</span> : <button className="row-action" onClick={() => confirm(slot)}>Confirm</button>}<button className="icon-button" title="Swap" onClick={() => swap(slot)}><RefreshCw size={13} /></button></div>
          </div>; })}
        </div>)}
      </div>
    </div>

    <div className="department-grid roster-grid" data-testid="volunteer-roster">
      {visible.map(team => <div className="department-card" key={team.name}>
        <div className="department-top"><span className="department-icon" style={{ background: `${team.color}22`, color: team.color }}><UsersRound size={18} /></span><span className="status-badge status-gray">{team.people.length} serving</span></div>
        <h3>{team.name}</h3>
        <p>Roles · <strong>{team.roles.join(", ")}</strong></p>
        <div className="roster-people">{team.people.map(p => <span key={p.id} title={p.name}><Avatar initials={p.initials} tone={p.tone} small /></span>)}</div>
      </div>)}
    </div>
  </>;
}
