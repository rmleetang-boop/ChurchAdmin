import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Filter, Search, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import MemberDrawer from "@/components/people/MemberDrawer";
import { AGE_GROUPS, BRANCHES, DEPARTMENTS, GENDERS, MEMBERS, STATUSES, TAGS, TODAY, fmtDate, type Member, type MemberStatus } from "@/data/demo";

type Filters = { branch: string; status: MemberStatus[]; department: string; ageGroup: string; gender: string; joined: string; lastSeen: string; tags: string[] };
const EMPTY: Filters = { branch: "All", status: [], department: "All", ageGroup: "All", gender: "All", joined: "Any", lastSeen: "Any", tags: [] };

const daysBetween = (a: string) => Math.round((TODAY.getTime() - new Date(a).getTime()) / 86400000);
const statusTone = (s: MemberStatus) => s === "Active" ? "status-green" : s === "Visitor" ? "status-blue" : s === "Inactive" ? "status-gray" : "status-gold";

function toggle<T>(list: T[], value: T) { return list.includes(value) ? list.filter(v => v !== value) : [...list, value]; }

export default function PeopleDirectory({ focusMemberId, onFocused }: { focusMemberId?: number | null; onFocused?: () => void }) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    if (focusMemberId) { const m = MEMBERS.find(x => x.id === focusMemberId); if (m) setSelected(m); onFocused?.(); }
  }, [focusMemberId, onFocused]);

  const filtered = useMemo(() => MEMBERS.filter(m => {
    const q = query.trim().toLowerCase();
    if (q && !`${m.name} ${m.email} ${m.phone} ${m.department}`.toLowerCase().includes(q)) return false;
    if (filters.branch !== "All" && m.branch !== filters.branch) return false;
    if (filters.status.length && !filters.status.includes(m.status)) return false;
    if (filters.department !== "All" && m.department !== filters.department) return false;
    if (filters.ageGroup !== "All" && m.ageGroup !== filters.ageGroup) return false;
    if (filters.gender !== "All" && m.gender !== filters.gender) return false;
    if (filters.joined !== "Any") { const d = daysBetween(m.joined); if (filters.joined === "30d" && d > 30) return false; if (filters.joined === "90d" && d > 90) return false; if (filters.joined === "1y" && d > 365) return false; if (filters.joined === "1y+" && d <= 365) return false; }
    if (filters.lastSeen !== "Any") { const d = daysBetween(m.lastAttendance); if (filters.lastSeen === "2w" && d > 14) return false; if (filters.lastSeen === "4w" && d > 28) return false; if (filters.lastSeen === "4w+" && d <= 28) return false; if (filters.lastSeen === "8w+" && d <= 56) return false; }
    if (filters.tags.length && !filters.tags.every(t => m.tags.includes(t))) return false;
    return true;
  }), [query, filters]);

  const activeCount = (filters.branch !== "All" ? 1 : 0) + filters.status.length + (filters.department !== "All" ? 1 : 0) + (filters.ageGroup !== "All" ? 1 : 0) + (filters.gender !== "All" ? 1 : 0) + (filters.joined !== "Any" ? 1 : 0) + (filters.lastSeen !== "Any" ? 1 : 0) + filters.tags.length;
  const counts = { active: MEMBERS.filter(m => m.status === "Active").length, visitors: MEMBERS.filter(m => m.status === "Visitor").length, follow: MEMBERS.filter(m => m.status === "Needs follow-up").length };

  const exportCsv = () => {
    const rows = [["Name", "Branch", "Department", "Status", "Age group", "Gender", "Joined", "Last attendance", "Tags", "Email", "Phone"], ...filtered.map(m => [m.name, m.branch, m.department, m.status, m.ageGroup, m.gender, m.joined, m.lastAttendance, m.tags.join("|"), m.email, m.phone])];
    const blob = new Blob([rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "people.csv"; a.click();
    toast.success(`Exported ${filtered.length} people`);
  };

  return <>
    <div className="toolbar" data-testid="people-toolbar">
      <div className="search-field"><Search size={16} /><input data-testid="people-search-input" placeholder="Search by name, email, phone, ministry…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <button data-testid="people-filters-toggle" className={`button button-ghost ${showFilters ? "is-on" : ""}`} onClick={() => setShowFilters(v => !v)}><Filter size={15} />Filters{activeCount > 0 && <em className="count-pill">{activeCount}</em>}</button>
      <button data-testid="people-export-btn" className="button button-ghost" onClick={exportCsv}><Download size={15} />Export</button>
    </div>

    {showFilters && <div className="filter-bar" data-testid="people-filter-bar">
      <div className="filter-group"><span className="filter-label">Branch</span><div className="chip-row"><button className={`filter-chip ${filters.branch === "All" ? "active" : ""}`} onClick={() => setFilters({ ...filters, branch: "All" })}>All</button>{BRANCHES.map(b => <button key={b} data-testid={`filter-branch-${b}`} className={`filter-chip ${filters.branch === b ? "active" : ""}`} onClick={() => setFilters({ ...filters, branch: b })}>{b}</button>)}</div></div>
      <div className="filter-group"><span className="filter-label">Status</span><div className="chip-row">{STATUSES.map(s => <button key={s} data-testid={`filter-status-${s.replace(/\s/g, "-")}`} className={`filter-chip ${filters.status.includes(s) ? "active" : ""}`} onClick={() => setFilters({ ...filters, status: toggle(filters.status, s) })}>{s}</button>)}</div></div>
      <div className="filter-group"><span className="filter-label">Tags</span><div className="chip-row">{TAGS.map(t => <button key={t} data-testid={`filter-tag-${t.replace(/\s/g, "-")}`} className={`filter-chip ${filters.tags.includes(t) ? "active" : ""}`} onClick={() => setFilters({ ...filters, tags: toggle(filters.tags, t) })}>{t}</button>)}</div></div>
      <div className="filter-selects">
        <label className="select-field"><span>Department</span><select data-testid="filter-department" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}><option>All</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></label>
        <label className="select-field"><span>Age group</span><select data-testid="filter-age" value={filters.ageGroup} onChange={e => setFilters({ ...filters, ageGroup: e.target.value })}><option>All</option>{AGE_GROUPS.map(a => <option key={a}>{a}</option>)}</select></label>
        <label className="select-field"><span>Gender</span><select data-testid="filter-gender" value={filters.gender} onChange={e => setFilters({ ...filters, gender: e.target.value })}><option>All</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></label>
        <label className="select-field"><span>Joined</span><select data-testid="filter-joined" value={filters.joined} onChange={e => setFilters({ ...filters, joined: e.target.value })}><option value="Any">Any time</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="1y">Last year</option><option value="1y+">Over a year</option></select></label>
        <label className="select-field"><span>Last attendance</span><select data-testid="filter-last-seen" value={filters.lastSeen} onChange={e => setFilters({ ...filters, lastSeen: e.target.value })}><option value="Any">Any</option><option value="2w">Within 2 weeks</option><option value="4w">Within 4 weeks</option><option value="4w+">Absent 4+ weeks</option><option value="8w+">Absent 8+ weeks</option></select></label>
        {activeCount > 0 && <button data-testid="filters-clear-btn" className="text-button" onClick={() => setFilters(EMPTY)}><X size={13} />Clear all</button>}
      </div>
    </div>}

    <div className="summary-strip"><div><span className="summary-label">Active members</span><strong>{counts.active}</strong></div><div><span className="summary-label">Visitors</span><strong>{counts.visitors}</strong></div><div><span className="summary-label">Needs follow-up</span><strong className="text-warm">{counts.follow}</strong></div></div>

    <div className="panel table-panel" data-testid="people-table">
      <div className="panel-heading"><div><div className="eyebrow">DIRECTORY</div><h2>{filtered.length} {filtered.length === 1 ? "person" : "people"}{activeCount > 0 && <span className="muted-inline"> · filtered</span>}</h2></div></div>
      <div className="table-head people-head"><span>Person</span><span>Branch</span><span>Ministry</span><span>Status</span><span>Last seen</span><span>Tags</span><span /></div>
      {filtered.length === 0 && <div className="table-empty" data-testid="people-empty">No one matches these filters. Try widening your search.</div>}
      {filtered.map(m => <button data-testid={`member-row-${m.id}`} className="table-row people-row" key={m.id} onClick={() => setSelected(m)}>
        <div className="table-person"><Avatar initials={m.initials} tone={m.tone} small /><div><strong>{m.name}</strong><span>{m.ageGroup} · {m.gender}</span></div></div>
        <span>{m.branch}</span>
        <span className="muted-cell">{m.department}</span>
        <span className={`status-badge ${statusTone(m.status)}`}>{m.status}</span>
        <span className="muted-cell">{fmtDate(m.lastAttendance)}</span>
        <span className="tag-row">{m.tags.slice(0, 2).map(t => <i key={t} className="tag">{t}</i>)}{m.tags.length > 2 && <i className="tag">+{m.tags.length - 2}</i>}</span>
        <ChevronRight size={15} className="row-chevron" />
      </button>)}
    </div>

    {selected && <MemberDrawer member={selected} onClose={() => setSelected(null)} />}
  </>;
}
