import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Command,
  Download,
  Ellipsis,
  FileText,
  Filter,
  FolderKanban,
  GitBranch,
  HandHeart,
  HeartHandshake,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Mic,
  Menu,
  MessageSquareText,
  MessageSquareHeart,
  MoreHorizontal,
  Plus,
  PlayCircle,
  Search,
  Send,
  Settings2,
  Sparkles,
  TrendingUp,
  Trash2,
  UserPlus,
  Users,
  UsersRound,
  WalletCards,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Section = "Overview" | "People" | "Attendance" | "Giving" | "Projects" | "Events" | "Communications" | "Sermons" | "Departments" | "Care inbox";

const navItems: { label: Section; icon: typeof LayoutDashboard; badge?: string }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "People", icon: UsersRound, badge: "1,248" },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Giving", icon: WalletCards },
  { label: "Projects", icon: FolderKanban, badge: "3" },
  { label: "Events", icon: CalendarDays, badge: "4" },
  { label: "Communications", icon: MessageSquareText },
  { label: "Sermons", icon: Mic, badge: "New" },
  { label: "Departments", icon: Users },
  { label: "Care inbox", icon: HeartHandshake, badge: "4" },
];

const members = [
  { name: "Amaka Nwosu", detail: "New here · 2nd visit", group: "Visitors", initials: "AN", tone: "rose", status: "Follow up" },
  { name: "Samuel Okoro", detail: "Joined 3 weeks ago", group: "Community", initials: "SO", tone: "indigo", status: "Welcome" },
  { name: "Grace Mensah", detail: "Prayer request · Tuesday", group: "Care team", initials: "GM", tone: "amber", status: "Respond" },
  { name: "Daniel Adeyemi", detail: "Birthday today", group: "Members", initials: "DA", tone: "emerald", status: "Message" },
  { name: "Esther Bello", detail: "Missed 3 Sundays", group: "Members", initials: "EB", tone: "violet", status: "Reach out" },
];

const events = [
  { day: "14", month: "SEP", title: "Leadership Summit", time: "Sat · 9:00 AM", type: "Leadership", color: "violet" },
  { day: "18", month: "SEP", title: "Midweek Worship", time: "Wed · 6:30 PM", type: "Worship", color: "blue" },
  { day: "21", month: "SEP", title: "Community Outreach", time: "Sat · 10:00 AM", type: "Outreach", color: "amber" },
];

const givingRows = [
  { name: "Anonymous", type: "Offering", amount: "R185,000", date: "Today, 9:42 AM", method: "Bank transfer", initials: "A", tone: "slate" },
  { name: "Tolu & Bisi Adebayo", type: "Tithe", amount: "R120,000", date: "Today, 8:16 AM", method: "Card", initials: "TB", tone: "emerald" },
  { name: "Michael Okafor", type: "Building project", amount: "R75,000", date: "Yesterday, 6:54 PM", method: "Bank transfer", initials: "MO", tone: "indigo" },
  { name: "Sarah Eze", type: "Offering", amount: "R35,000", date: "Yesterday, 12:03 PM", method: "USSD", initials: "SE", tone: "rose" },
];

const branches = [
  { id: 1, name: "Milnerton", city: "Milnerton", pastor: "Pastor Parfait Kolesha", members: 1248, attendance: 864, giving: 6840000 },
  { id: 2, name: "Bellville", city: "Bellville", pastor: "Dominique Somwe", members: 642, attendance: 418, giving: 3180000 },
  { id: 3, name: "Eastgate", city: "Eastgate", pastor: "Dominique Somwe", members: 486, attendance: 309, giving: 2460000 },
  { id: 4, name: "Kinshasa", city: "Kinshasa", pastor: "Dominique Somwe", members: 918, attendance: 602, giving: 4210000 },
  { id: 5, name: "Lubumbashi", city: "Lubumbashi", pastor: "Dominique Somwe", members: 734, attendance: 481, giving: 3570000 },
];

const zar = (amount: number) => `R${amount.toLocaleString("en-ZA")}`;

const departments = [
  { name: "Worship & Creative", lead: "Miriam Okafor", count: "28 people", color: "#6958d9", icon: Sparkles, progress: 84, branch: "Milnerton" },
  { name: "Children's Church", lead: "Daniel Adeyemi", count: "34 people", color: "#e49351", icon: HandHeart, progress: 72, branch: "Bellville" },
  { name: "Welcome & Hospitality", lead: "Grace Mensah", count: "19 people", color: "#2c9b87", icon: UsersRound, progress: 91, branch: "Eastgate" },
  { name: "Media & Production", lead: "Samuel Okoro", count: "16 people", color: "#4a7cc9", icon: BookOpen, progress: 67, branch: "Kinshasa" },
];

function Avatar({ initials, tone = "indigo", small = false }: { initials: string; tone?: string; small?: boolean }) {
  return <span className={`avatar avatar-${tone} ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

function MetricCard({ icon: Icon, label, value, change, positive = true, tint }: { icon: typeof Users; label: string; value: string; change: string; positive?: boolean; tint: string }) {
  return (
    <div className="metric-card">
      <div className="metric-topline"><span className={`metric-icon ${tint}`}><Icon size={18} strokeWidth={1.8} /></span><button className="icon-button subtle"><MoreHorizontal size={18} /></button></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-change ${positive ? "up" : "down"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}<span>vs last month</span></div>
    </div>
  );
}

function MiniBars() {
  const bars = [38, 52, 45, 64, 58, 75, 69, 84, 76, 89, 82, 96];
  return <div className="mini-bars" aria-label="Attendance trend"><div className="goal-line" /><div className="bar-row">{bars.map((height, index) => <div key={index} className="bar-wrap"><div className={`bar ${index === bars.length - 1 ? "bar-active" : ""}`} style={{ height: `${height}%` }} /></div>)}</div><div className="chart-axis"><span>May 26</span><span>Jun 2</span><span>Jun 9</span><span>Jun 16</span><span>Jun 23</span><span>Jun 30</span></div></div>;
}

function NetworkOverview({ scope }: { scope: number | "global" }) {
  const visibleBranches = scope === "global" ? branches : branches.filter(branch => branch.id === scope);
  const totals = visibleBranches.reduce((summary, branch) => ({
    members: summary.members + branch.members,
    attendance: summary.attendance + branch.attendance,
    giving: summary.giving + branch.giving,
  }), { members: 0, attendance: 0, giving: 0 });
  return <section className="panel" style={{ marginBottom: 24 }}><div className="panel-heading"><div><div className="eyebrow">OVERSEER NETWORK VIEW</div><h2>{scope === "global" ? "All church branches" : `${visibleBranches[0]?.name} branch`}</h2></div><span className="status-badge status-green">{visibleBranches.length} {visibleBranches.length === 1 ? "branch" : "branches"}</span></div><div className="summary-strip"><div><span className="summary-label">Members</span><strong>{totals.members.toLocaleString()}</strong></div><div><span className="summary-label">Sunday attendance</span><strong>{totals.attendance.toLocaleString()}</strong></div><div><span className="summary-label">Giving this month</span><strong>{zar(totals.giving)}</strong></div></div><div className="branch-list">{visibleBranches.map(branch => <div className="event-row" key={branch.id}><span className="activity-icon activity-member"><GitBranch size={15} /></span><div className="event-info"><strong>{branch.name} · {branch.city}</strong><span>{branch.pastor} · {branch.members.toLocaleString()} members · {zar(branch.giving)} giving</span></div><span className="status-badge status-green">{Math.round(branch.attendance / branch.members * 100)}% attendance</span></div>)}</div></section>;
}

function Overview({ onNavigate, scope }: { onNavigate: (section: Section) => void; scope: number | "global" }) {
  return <>
    <section className="hero-row">
      <div><div className="eyebrow">Sunday, June 30, 2024 · Week 26</div><h1>Good morning, Dominique Somwe <span className="wave">✦</span></h1><p className="hero-copy">Here’s the pulse of <strong>Heirs of Promise Sanctuary</strong>. You have a healthy week ahead.</p></div>
      <div className="hero-actions"><button className="button button-ghost"><Download size={16} />Export report</button><button className="button button-primary" onClick={() => toast.success("Quick record opened", { description: "Choose attendance, giving, member, or event." })}><Plus size={17} />Quick record</button></div>
    </section>
    <NetworkOverview scope={scope} />
    <section className="metrics-grid">
      <MetricCard icon={Users} label="Total members" value="1,248" change="8.4%" tint="lavender" />
      <MetricCard icon={ClipboardCheck} label="Sunday attendance" value="864" change="6.2%" tint="mint" />
      <MetricCard icon={CircleDollarSign} label="Giving this month" value="R6.84M" change="12.8%" tint="peach" />
      <MetricCard icon={HandHeart} label="Follow-up queue" value="18" change="4.1%" positive={false} tint="sky" />
    </section>
    <section className="dashboard-grid top-grid">
      <div className="panel attendance-panel">
        <div className="panel-heading"><div><div className="eyebrow">MEMBERSHIP HEALTH</div><h2>Attendance overview</h2></div><button className="select-button">Last 6 weeks <ChevronDown size={15} /></button></div>
        <div className="attendance-highlight"><div><div className="big-number">864 <span>people</span></div><div className="muted-copy"><span className="success-dot" /> +6.2% from last Sunday</div></div><div className="attendance-legend"><span><i className="legend-dot legend-purple" />In person</span><span><i className="legend-dot legend-light" />Online</span></div></div><MiniBars />
      </div>
      <div className="panel upcoming-panel">
        <div className="panel-heading"><div><div className="eyebrow">NEXT UP</div><h2>Upcoming events</h2></div><button className="text-button" onClick={() => onNavigate("Events")}>View all <ChevronRight size={15} /></button></div>
        <div className="event-list">{events.map((event) => <div className="event-row" key={event.title}><div className={`date-tile date-${event.color}`}><strong>{event.day}</strong><span>{event.month}</span></div><div className="event-info"><strong>{event.title}</strong><span>{event.time} · {event.type}</span></div><button className="icon-button"><MoreHorizontal size={17} /></button></div>)}</div>
        <button className="add-event-button" onClick={() => toast.success("Event draft started", { description: "Add a title, date, and host to continue." })}><Plus size={15} /> Create new event</button>
      </div>
    </section>
    <section className="dashboard-grid bottom-grid">
      <div className="panel attention-panel"><div className="panel-heading"><div><div className="eyebrow">PEOPLE TO CARE FOR</div><h2>Needs your attention <span className="count-pill">5</span></h2></div><button className="text-button" onClick={() => onNavigate("People")}>Open people <ChevronRight size={15} /></button></div><div className="attention-list">{members.map((member) => <div className="attention-row" key={member.name}><Avatar initials={member.initials} tone={member.tone} /><div className="person-info"><strong>{member.name}</strong><span>{member.detail}</span></div><span className="person-group">{member.group}</span><button className="row-action" onClick={() => toast.success(`${member.status} task created`, { description: member.name })}>{member.status}</button></div>)}</div></div>
      <div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">LIVE LEDGER</div><h2>Recent activity</h2></div><button className="icon-button"><Ellipsis size={18} /></button></div><div className="activity-list"><div className="activity-item"><span className="activity-icon activity-giving"><CircleDollarSign size={15} /></span><p><strong>R185,000 offering</strong> received from Anonymous<span>Today, 9:42 AM</span></p></div><div className="activity-item"><span className="activity-icon activity-member"><UserPlus size={15} /></span><p><strong>Amaka Nwosu</strong> added as a visitor<span>Today, 9:10 AM</span></p></div><div className="activity-item"><span className="activity-icon activity-message"><Send size={15} /></span><p><strong>Welcome message</strong> sent to 12 first-time guests<span>Today, 8:30 AM</span></p></div><div className="activity-item"><span className="activity-icon activity-event"><CalendarDays size={15} /></span><p><strong>Leadership Summit</strong> updated by Miriam<span>Yesterday, 4:20 PM</span></p></div></div></div>
    </section>
  </>;
}

function PeopleView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => members.filter((member) => member.name.toLowerCase().includes(query.toLowerCase())), [query]);
  return <ModuleLayout eyebrow="PEOPLE DIRECTORY" title="People" description="Know your church family, keep every story current, and make follow-up personal." action="Add person" onAction={() => toast.success("New person form opened")}><div className="toolbar"><div className="search-field"><Search size={17} /><input placeholder="Search people by name..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="button button-ghost"><Filter size={16} />Filters</button><button className="button button-ghost"><Download size={16} />Export</button></div><div className="summary-strip"><div><span className="summary-label">Active members</span><strong>1,248</strong></div><div><span className="summary-label">Visitors this month</span><strong>86</strong></div><div><span className="summary-label">Needs follow-up</span><strong className="text-warm">18</strong></div></div><div className="table-panel"><div className="table-head"><span>Person</span><span>Group</span><span>Last activity</span><span>Status</span><span /></div>{filtered.map((member) => <div className="table-row" key={member.name}><div className="table-person"><Avatar initials={member.initials} tone={member.tone} small /><div><strong>{member.name}</strong><span>{member.detail}</span></div></div><span>{member.group}</span><span className="muted-cell">{member.name === "Amaka Nwosu" ? "Today" : "2 days ago"}</span><span className="status-badge status-green">Active</span><button className="icon-button"><MoreHorizontal size={17} /></button></div>)}</div></ModuleLayout>;
}

function AttendanceView() {
  const [response, setResponse] = useState<"attending" | "online" | "not_attending" | null>(null);
  return <ModuleLayout eyebrow="WEEKLY RHYTHM" title="Attendance" description="See who is showing up, where people are connecting, and what needs a gentle nudge." action="Record attendance" onAction={() => toast.success("Attendance recorder opened", { description: "Sunday service · June 30" })}><div className="member-declaration"><div className="member-declaration-icon"><ClipboardCheck size={19} /></div><div><div className="eyebrow">MEMBER APP EXPERIENCE</div><h2>Let members declare attendance before service day</h2><p>Send a personal email or WhatsApp reminder with one-tap responses. Their answer helps teams prepare well.</p></div><div className="declaration-actions"><button className={response === "attending" ? "response-button chosen" : "response-button"} onClick={() => { setResponse("attending"); toast.success("Attendance declared", { description: "Attending in person" }); }}>I’m attending</button><button className={response === "online" ? "response-button chosen" : "response-button"} onClick={() => { setResponse("online"); toast.success("Attendance declared", { description: "Joining online" }); }}>Joining online</button><button className={response === "not_attending" ? "response-button muted chosen" : "response-button muted"} onClick={() => { setResponse("not_attending"); toast.success("Response saved", { description: "Not attending this Sunday" }); }}>Not this week</button></div></div><div className="attendance-tabs"><button className="tab-active">Sunday Service</button><button>Midweek Worship</button><button>Small Groups</button></div><div className="attendance-view-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">JUNE 30, 2024</div><h2>Sunday service check-in</h2></div><span className="status-badge status-green">Complete</span></div><div className="checkin-number"><strong>864</strong><span>checked in</span><div className="checkin-progress"><div style={{ width: "69%" }} /></div><small>69% of active members · Target 75%</small></div><div className="attendance-breakdown"><div><span className="breakdown-dot purple" /><strong>Adults</strong><b>612</b></div><div><span className="breakdown-dot coral" /><strong>Children</strong><b>184</b></div><div><span className="breakdown-dot gold" /><strong>First-time</strong><b>68</b></div></div></div><div className="panel"><div className="panel-heading"><div><div className="eyebrow">RETENTION SIGNAL</div><h2>Attendance trend</h2></div><TrendingUp size={19} className="icon-success" /></div><MiniBars /><div className="insight-card"><Sparkles size={16} /><span><strong>Good momentum.</strong> Attendance has grown for 4 weeks in a row.</span></div></div></div><div className="panel service-summary"><div className="panel-heading"><div><div className="eyebrow">SERVICE BREAKDOWN</div><h2>Where people connected</h2></div><button className="select-button">This month <ChevronDown size={15} /></button></div><div className="service-row"><span className="service-color service-purple" /><div><strong>In-person service</strong><small>Main auditorium · 10:00 AM</small></div><b>642</b><span className="service-percent">74%</span></div><div className="service-row"><span className="service-color service-blue" /><div><strong>Online service</strong><small>Livestream · 10:00 AM</small></div><b>154</b><span className="service-percent">18%</span></div><div className="service-row"><span className="service-color service-gold" /><div><strong>Children's church</strong><small>Upstairs hall · 10:00 AM</small></div><b>68</b><span className="service-percent">8%</span></div></div></ModuleLayout>;
}

function GivingView() {
  return <ModuleLayout eyebrow="STEWARDSHIP" title="Giving" description="A clear, accountable view of offerings, tithes, projects, and every contribution." action="Record giving" onAction={() => toast.success("Giving entry opened", { description: "Add amount, fund, and contributor details." })}><div className="giving-stat-grid"><div className="giving-stat featured"><span>This month</span><strong>R6.84M</strong><small><ArrowUpRight size={14} />12.8% from May</small></div><div className="giving-stat"><span>Offering</span><strong>R2.24M</strong><small>33% of total</small></div><div className="giving-stat"><span>Tithe</span><strong>R3.76M</strong><small>55% of total</small></div><div className="giving-stat"><span>Projects</span><strong>R840K</strong><small>12% of total</small></div></div><div className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">RECENT CONTRIBUTIONS</div><h2>Latest giving activity</h2></div><button className="button button-ghost">View report <ChevronRight size={15} /></button></div><div className="table-head giving-head"><span>Contributor</span><span>Fund</span><span>Amount</span><span>Date</span><span>Method</span></div>{givingRows.map((row) => <div className="table-row giving-row" key={`${row.name}-${row.amount}`}><div className="table-person"><Avatar initials={row.initials} tone={row.tone} small /><div><strong>{row.name}</strong><span>Receipt ready</span></div></div><span>{row.type}</span><strong className="amount-cell">{row.amount}</strong><span className="muted-cell">{row.date}</span><span className="method-cell">{row.method}</span></div>)}</div></ModuleLayout>;
}

type Project = { id: number; title: string; description: string; target: number; raised: number; status: "Active" | "Draft" | "Completed"; deadline: string; leader: string; branch: string; link: string };

function ProjectView() {
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, title: "New auditorium chairs", description: "Replace the main auditorium seating before the October thanksgiving service.", target: 4500000, raised: 2860000, status: "Active", deadline: "Oct 12, 2024", leader: "Dominique Somwe", branch: "Milnerton", link: "https://paystack.com/pay/heirs-promise-chairs" },
    { id: 2, title: "Children's church refresh", description: "Make the upstairs hall brighter, safer, and more welcoming for our children.", target: 1800000, raised: 1125000, status: "Active", deadline: "Sep 28, 2024", leader: "Daniel Adeyemi", branch: "Bellville", link: "https://paystack.com/pay/heirs-promise-kids" },
    { id: 3, title: "Community food bank", description: "Monthly food support for 100 families in our neighborhood.", target: 1200000, raised: 1200000, status: "Completed", deadline: "Aug 31, 2024", leader: "Grace Mensah", branch: "Eastgate", link: "https://paystack.com/pay/heirs-promise-food" },
    { id: 4, title: "Building project", description: "Expand the Milnerton branch facilities to welcome more families and ministries.", target: 3000000, raised: 180000, status: "Active", deadline: "Mar 31, 2025", leader: "Pastor Pascale Kolesha Avenvuka", branch: "Milnerton", link: "https://paystack.com/pay/heirs-promise-milnerton-building" },
  ]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [contributing, setContributing] = useState<Project | null>(null);
  const [amount, setAmount] = useState("50000");
  const [form, setForm] = useState({ title: "", description: "", target: "2500000", deadline: "Dec 20, 2024", link: "" });
  const openCreate = () => { setEditing({ id: 0, title: "", description: "", target: 2500000, raised: 0, status: "Draft", deadline: "Dec 20, 2024", leader: "Dominique Somwe", branch: "Milnerton", link: "" }); setForm({ title: "", description: "", target: "2500000", deadline: "Dec 20, 2024", link: "" }); };
  const saveProject = () => { if (!form.title.trim()) return toast.error("Add a project name first"); const next: Project = { id: editing?.id || Date.now(), title: form.title, description: form.description || "A new church project with a clear goal and accountable progress.", target: Number(form.target) || 0, raised: editing?.raised || 0, status: editing?.status || "Draft", deadline: form.deadline, leader: "Dominique Somwe", branch: editing?.branch || "Milnerton", link: form.link || "https://paystack.com/pay/heirs-promise-project" }; setProjects(current => editing?.id ? current.map(project => project.id === editing.id ? next : next.id === project.id ? project : project) : [next, ...current]); setEditing(null); toast.success(editing?.id ? "Project updated" : "Project created", { description: "Your project is ready for contributions." }); };
  const addContribution = () => { const value = Number(amount); if (!contributing || !value || value < 1) return toast.error("Enter a contribution amount"); setProjects(current => current.map(project => project.id === contributing.id ? { ...project, raised: Math.min(project.target, project.raised + value), status: project.raised + value >= project.target ? "Completed" : "Active" } : project)); setContributing(null); toast.success("Contribution recorded", { description: `R${value.toLocaleString()} added to ${contributing?.title}.` }); };
  return <ModuleLayout eyebrow="MISSION & STEWARDSHIP" title="Projects" description="Give every initiative a leader, a transparent goal, and a simple path for people to contribute." action="New project" onAction={openCreate}><div className="project-banner"><div><div className="eyebrow">PROJECT WORKSPACE</div><h2>Build trust through visible progress</h2><p>Leaders can own the full lifecycle — create, update, track, and close projects — while members see exactly where their giving is going.</p></div><div className="project-banner-stats"><span><strong>{projects.filter(project => project.status === "Active").length}</strong> active projects</span><span><strong>R{projects.reduce((total, project) => total + project.raised, 0).toLocaleString()}</strong> raised</span></div></div><div className="project-grid">{projects.map(project => { const progress = Math.min(100, Math.round((project.raised / project.target) * 100)); return <div className="project-card" key={project.id}><div className="project-card-top"><span className={`status-badge ${project.status === "Completed" ? "status-green" : project.status === "Draft" ? "status-gray" : "status-gold"}`}>{project.status}</span><div className="project-actions"><button className="icon-button" title="Edit project" onClick={() => { setEditing(project); setForm({ title: project.title, description: project.description, target: String(project.target), deadline: project.deadline, link: project.link }); }}><FileText size={15} /></button><button className="icon-button danger-hover" title="Delete project" onClick={() => { setProjects(current => current.filter(item => item.id !== project.id)); toast.success("Project deleted"); }}><Trash2 size={15} /></button></div></div><h3>{project.title}</h3><p>{project.description}</p><div className="project-meta"><span>Branch <strong>{project.branch}</strong></span><span>Led by <strong>{project.leader}</strong></span><span>Due {project.deadline}</span></div><div className="project-progress-row"><strong>R{project.raised.toLocaleString()}</strong><span>of R{project.target.toLocaleString()}</span><b>{progress}%</b></div><div className="project-progress"><div style={{ width: `${progress}%` }} /></div><div className="project-card-footer"><button className="button button-primary" onClick={() => setContributing(project)}><CircleDollarSign size={14} />Record contribution</button><a className="link-button" href={project.link} target="_blank" rel="noreferrer">Open payment link <ChevronRight size={13} /></a></div></div>; })}<button className="project-card add-project-card" onClick={openCreate}><span className="add-circle"><Plus size={18} /></span><strong>Start a new project</strong><span>Assign a leader and funding goal</span></button></div>{editing && <div className="modal-backdrop"><div className="modal-card"><div className="modal-header"><div><div className="eyebrow">PROJECT DETAILS</div><h2>{editing.id ? "Edit project" : "Create project"}</h2></div><button className="icon-button" onClick={() => setEditing(null)}><X size={18} /></button></div><label>Project name<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. New auditorium chairs" /></label><label>Why this matters<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Help your church family understand the mission." /></label><div className="form-two-col"><label>Target amount<input type="number" value={form.target} onChange={event => setForm({ ...form, target: event.target.value })} /></label><label>Target date<input value={form.deadline} onChange={event => setForm({ ...form, deadline: event.target.value })} /></label></div><label>Payment link<input value={form.link} onChange={event => setForm({ ...form, link: event.target.value })} placeholder="https://paystack.com/pay/..." /></label><div className="modal-footer"><button className="button button-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" onClick={saveProject}>Save project</button></div></div></div>}{contributing && <div className="modal-backdrop"><div className="modal-card compact-modal"><div className="modal-header"><div><div className="eyebrow">RECORD PROGRESS</div><h2>{contributing.title}</h2></div><button className="icon-button" onClick={() => setContributing(null)}><X size={18} /></button></div><p className="modal-copy">Add an offline, bank transfer, or cash contribution to keep this project progress accurate.</p><label>Contribution amount<input type="number" value={amount} onChange={event => setAmount(event.target.value)} /></label><div className="modal-footer"><button className="button button-ghost" onClick={() => setContributing(null)}>Cancel</button><button className="button button-primary" onClick={addContribution}>Add contribution</button></div></div></div>}</ModuleLayout>;
}

function EventsView() {
  return <ModuleLayout eyebrow="CALENDAR & MOMENTS" title="Events" description="Bring every gathering, team, and moment of connection into one visible rhythm." action="Create event" onAction={() => toast.success("Event draft started", { description: "Add a title, date, and host to continue." })}><div className="event-toolbar"><div className="month-switcher"><button className="icon-button"><ChevronRight size={16} className="flip-x" /></button><strong>September 2024</strong><button className="icon-button"><ChevronRight size={16} /></button></div><div><button className="button button-ghost"><CalendarDays size={16} />Month view</button></div></div><div className="event-card-grid">{events.concat([{ day: "28", month: "SEP", title: "New Members Class", time: "Sat · 2:00 PM", type: "Growth", color: "green" }]).map((event) => <div className="event-card" key={event.title}><div className={`event-card-top event-${event.color}`}><div className="date-tile date-light"><strong>{event.day}</strong><span>{event.month}</span></div><span className="event-kind">{event.type}</span><button className="icon-button light"><MoreHorizontal size={18} /></button></div><div className="event-card-body"><h3>{event.title}</h3><p><Clock3 size={14} />{event.time}</p><div className="event-footer"><div className="mini-avatars"><Avatar initials="DA" tone="indigo" small /><Avatar initials="GM" tone="rose" small /><Avatar initials="+8" tone="slate" small /></div><span>12 attending</span></div></div></div>)}</div></ModuleLayout>;
}

function CommunicationsView() {
  const [sent, setSent] = useState(false);
  const [channel, setChannel] = useState("both");
  const [paymentLink, setPaymentLink] = useState("https://paystack.com/pay/living-hope-chairs");
  return <ModuleLayout eyebrow="KEEPING PEOPLE CLOSE" title="Communications" description="Share the right message with the right people, without losing the personal touch." action="New message" onAction={() => toast.success("Message composer ready")}><div className="communication-layout"><div className="panel message-list"><div className="panel-heading"><div><div className="eyebrow">RECENT CAMPAIGNS</div><h2>Messages</h2></div><button className="icon-button"><Filter size={17} /></button></div><div className="message-row selected"><span className="message-icon purple"><Send size={15} /></span><div><strong>Sunday service reminder</strong><span>Members · Sent today at 8:30 AM</span></div><span className="status-badge status-green">Sent</span></div><div className="message-row"><span className="message-icon blue"><Mail size={15} /></span><div><strong>Welcome to Living Hope</strong><span>First-time guests · Sent Jun 28</span></div><span className="status-badge status-green">Sent</span></div><div className="message-row"><span className="message-icon gold"><Clock3 size={15} /></span><div><strong>Leadership Summit update</strong><span>Leaders · Scheduled for Sep 10</span></div><span className="status-badge status-gold">Scheduled</span></div><div className="message-row"><span className="message-icon coral"><FileText size={15} /></span><div><strong>July prayer focus</strong><span>Draft · Last edited yesterday</span></div><span className="status-badge status-gray">Draft</span></div></div><div className="panel composer-panel"><div className="panel-heading"><div><div className="eyebrow">MESSAGE COMPOSER</div><h2>Write a new message</h2></div><span className="channel-badge"><MessageSquareText size={14} />{channel === "both" ? "Email + WhatsApp" : channel === "email" ? "Email" : "WhatsApp"}</span></div><label>Audience<select defaultValue="All active members"><option>All active members</option><option>Leaders & department heads</option><option>First-time guests</option><option>Parents & guardians</option></select></label><label>Send through<select value={channel} onChange={event => setChannel(event.target.value)}><option value="both">Email and WhatsApp</option><option value="email">Email only</option><option value="whatsapp">WhatsApp only</option></select></label><label>Subject<input defaultValue="Sunday service reminder" /></label><label>Message<textarea defaultValue="Good morning, family. We look forward to worshipping with you this Sunday at 10:00 AM. Come expectant." /></label><label>Contribution payment link<input value={paymentLink} onChange={event => setPaymentLink(event.target.value)} placeholder="Paste the project payment link" /></label><div className="link-preview"><CircleDollarSign size={14} /><span>This link will be included in the reminder so members can contribute in one tap.</span></div><div className="composer-footer"><span><span className="success-dot" />Estimated reach: <strong>1,248 people</strong></span><button className="button button-primary" onClick={() => { setSent(true); toast.success("Reminder scheduled", { description: `${channel === "both" ? "Email and WhatsApp" : channel} delivery is ready for provider credentials.` }); }}>{sent ? "Scheduled" : "Schedule reminder"}<Send size={15} /></button></div></div></div></ModuleLayout>;
}

function DepartmentsView() {
  const { user } = useAuth();
  const [items, setItems] = useState(departments);
  const [branch, setBranch] = useState("Milnerton");
  const [form, setForm] = useState({ name: "", lead: "", branch: "Milnerton" });
  const [open, setOpen] = useState(false);
  const canManage = user?.role === "admin";
  const visible = items.filter(item => item.branch === branch);
  const addDepartment = () => {
    if (!form.name.trim()) return toast.error("Add a department name first");
    setItems(current => [...current, { name: form.name.trim(), lead: form.lead.trim() || "Branch leader", count: "0 people", color: "#6958d9", icon: Sparkles, progress: 0, branch: form.branch }]);
    setBranch(form.branch);
    setForm({ name: "", lead: "", branch: form.branch });
    setOpen(false);
    toast.success("Department added", { description: `${form.name} · ${form.branch}` });
  };
  return <ModuleLayout eyebrow="TEAMS & OWNERSHIP" title="Departments" description="Each branch can have its own structure. Admins can add departments to one branch without changing another branch." action="Add department" onAction={() => canManage ? setOpen(true) : toast.error("Only administrators can add departments")}><div className="toolbar"><label className="select-button">Branch<select value={branch} onChange={event => setBranch(event.target.value)}>{branches.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><span className="status-badge status-green">{visible.length} departments in {branch}</span></div><div className="department-grid">{visible.map((department) => { const Icon = department.icon; return <div className="department-card" key={`${department.branch}-${department.name}`}><div className="department-top"><span className="department-icon" style={{ backgroundColor: `${department.color}16`, color: department.color }}><Icon size={19} /></span><button className="icon-button"><MoreHorizontal size={17} /></button></div><h3>{department.name}</h3><p>Led by <strong>{department.lead}</strong></p><div className="department-bottom"><span>{department.count}</span><span>{department.progress}% active</span></div><div className="progress-track"><div style={{ width: `${department.progress}%`, backgroundColor: department.color }} /></div></div>})}<button className="department-card add-department" onClick={() => canManage ? setOpen(true) : toast.error("Only administrators can add departments")}><span className="add-circle"><Plus size={19} /></span><strong>Add to {branch}</strong><span>Create a branch-specific team</span></button></div>{open && <div className="modal-backdrop"><div className="modal-card"><div className="modal-header"><div><div className="eyebrow">ADMIN DEPARTMENT SETUP</div><h2>Add department</h2></div><button className="icon-button" onClick={() => setOpen(false)}><X size={18} /></button></div><label>Branch<select value={form.branch} onChange={event => setForm({ ...form, branch: event.target.value })}>{branches.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label>Department name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Young Adults" /></label><label>Department lead<input value={form.lead} onChange={event => setForm({ ...form, lead: event.target.value })} placeholder="Optional" /></label><div className="modal-footer"><button className="button button-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" onClick={addDepartment}>Add department</button></div></div></div>}</ModuleLayout>;
}

function SermonsView() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Sunday worship — Living with courage");
  const [preacher, setPreacher] = useState("Dominique Somwe");
  const [serviceDate, setServiceDate] = useState("2024-06-30");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [channel, setChannel] = useState<"email" | "whatsapp" | "both">("both");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [sermonId, setSermonId] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sermonQuery = trpc.sermons.list.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const recordMutation = trpc.sermons.record.useMutation();
  const distributeMutation = trpc.sermons.distribute.useMutation();

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error("Recording is not available in this browser");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)); stream.getTracks().forEach(track => track.stop()); };
      recorder.start(); recorderRef.current = recorder; setRecording(true); toast.success("Recording started", { description: "Speak naturally. You can stop when the sermon is complete." });
    } catch { toast.error("Microphone access was not granted", { description: "Allow microphone access to record a sermon." }); }
  };
  const stopRecording = () => { recorderRef.current?.stop(); recorderRef.current = null; setRecording(false); };
  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
  const transcribe = async () => {
    if (!audioBlob) return toast.error("Record the sermon first");
    if (!user?.role) return toast.info("Sign in as a leader to save and transcribe recordings");
    try {
      const encodedAudio = await blobToDataUrl(audioBlob);
      const encodedVideo = videoFile ? await blobToDataUrl(videoFile) : undefined;
      const result = await recordMutation.mutateAsync({ title, preacher, serviceDate: new Date(`${serviceDate}T10:00:00`), audioBase64: encodedAudio, audioMimeType: audioBlob.type || "audio/webm", videoUrl: videoFile ? "" : videoUrl, videoBase64: encodedVideo, videoMimeType: videoFile?.type });
      setTranscript(result?.transcript || "Transcript ready. The sermon recording has been saved.");
      setHighlights(result?.highlights ? JSON.parse(result.highlights) : ["Transcript ready for review", "Key sermon themes will appear here"]);
      setSermonId(result?.id ?? null); toast.success("Transcript and highlights ready", { description: "Review the highlights before sharing them." });
    } catch (error) { toast.error("Transcription could not be completed", { description: error instanceof Error ? error.message : "Try recording again." }); }
  };
  const distribute = () => { if (!sermonId) return toast.info("Save the transcript before distributing highlights"); distributeMutation.mutate({ id: sermonId, channel, paymentLink: "" }, { onSuccess: () => toast.success("Highlights queued", { description: `${channel === "both" ? "Email and WhatsApp" : channel} distribution is ready.` }) }); };
  const existingSermons = sermonQuery.data ?? [];
  return <ModuleLayout eyebrow="MESSAGE & MEMORY" title="Sermons" description="Record preaching once, turn it into a searchable transcript, and share the strongest highlights with your church family." action={recording ? "Stop recording" : "Start recording"} onAction={recording ? stopRecording : startRecording}><div className="sermon-explainer"><div className="sermon-explainer-icon"><Mic size={19} /></div><div><div className="eyebrow">A SIMPLE LEADER WORKFLOW</div><h2>Record → transcribe → share</h2><p>Audio is required for transcription. Leaders can add a video link or upload a video when they want members to watch the full message.</p></div><span className={`recording-state ${recording ? "live" : ""}`}><i />{recording ? "Recording now" : "Ready to record"}</span></div><div className="sermon-layout"><div className="panel sermon-recorder-panel"><div className="panel-heading"><div><div className="eyebrow">SERMON DETAILS</div><h2>{audioBlob ? "Recording captured" : "Prepare a recording"}</h2></div><span className="channel-badge"><Mic size={14} />Audio + transcript</span></div><div className="sermon-form"><label>Sermon title<input value={title} onChange={event => setTitle(event.target.value)} /></label><div className="sermon-form-grid"><label>Preacher<input value={preacher} onChange={event => setPreacher(event.target.value)} /></label><label>Service date<input type="date" value={serviceDate} onChange={event => setServiceDate(event.target.value)} /></label></div><label>Optional video link <span className="label-hint">YouTube, Vimeo, or church video URL</span><input value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://..." /></label><label className="video-upload-label">Or upload a video <span className="label-hint">Optional · up to 100MB</span><input type="file" accept="video/*" onChange={event => setVideoFile(event.target.files?.[0] ?? null)} /></label>{videoFile && <div className="video-file-note"><Video size={15} /><span>{videoFile.name} selected for upload</span></div>}{audioUrl ? <div className="audio-preview"><PlayCircle size={17} /><div><strong>Audio recording ready</strong><span>Listen before requesting the transcript.</span></div><audio controls src={audioUrl} /></div> : <div className="record-dropzone"><Mic size={20} /><strong>Record the sermon from this browser</strong><span>Use a quiet room and keep the tab open while recording.</span><button className="button button-primary" onClick={startRecording}><Mic size={15} />{recording ? "Recording…" : "Record audio"}</button></div>}<button className="button button-primary wide-button" disabled={!audioBlob || recordMutation.isPending} onClick={transcribe}>{recordMutation.isPending ? "Transcribing…" : "Generate transcript & highlights"}<Sparkles size={15} /></button></div></div><div className="panel sermon-output-panel"><div className="panel-heading"><div><div className="eyebrow">AI-ASSISTED NOTES</div><h2>Transcript & highlights</h2></div><span className="status-badge status-gold">{transcript ? "Ready" : "Waiting"}</span></div>{transcript ? <><div className="transcript-box"><strong>Transcript</strong><p>{transcript}</p></div><div className="highlight-box"><div className="highlight-heading"><strong>Shareable highlights</strong><span>{highlights.length} points</span></div>{highlights.map((highlight, index) => <div className="highlight-row" key={`${highlight}-${index}`}><span>{index + 1}</span><p>{highlight}</p></div>)}</div><div className="distribution-box"><div><strong>Distribute to members</strong><span>Send the highlight summary with a link to the full message.</span></div><select value={channel} onChange={event => setChannel(event.target.value as "email" | "whatsapp" | "both")}><option value="both">Email + WhatsApp</option><option value="email">Email only</option><option value="whatsapp">WhatsApp only</option></select><button className="button button-primary" onClick={distribute}><Send size={14} />Share highlights</button></div></> : <div className="sermon-empty"><Sparkles size={23} /><strong>Your transcript will appear here</strong><span>After recording, ChurchFlow will prepare the full text and extract concise highlights for sharing.</span></div>}</div></div><div className="panel recent-sermons-panel"><div className="panel-heading"><div><div className="eyebrow">SERMON LIBRARY</div><h2>Recent messages</h2></div><button className="text-button">View all <ChevronRight size={15} /></button></div>{existingSermons.length ? existingSermons.slice(0, 4).map(sermon => <div className="sermon-library-row" key={sermon.id}><span className="sermon-library-icon"><PlayCircle size={15} /></span><div><strong>{sermon.title}</strong><span>{sermon.preacher} · {new Date(sermon.serviceDate).toLocaleDateString()}</span></div><span className="status-badge status-green">{sermon.status}</span><button className="icon-button"><MoreHorizontal size={16} /></button></div>) : <div className="library-empty">No saved sermons yet. Your first recording will appear here.</div>}</div></ModuleLayout>;
}

function CareInboxView() {
  const { user } = useAuth();
  const prayerQuery = trpc.admin.prayerRequests.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const testimonyQuery = trpc.admin.testimonies.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState([
    { id: 1, kind: "Prayer request", title: "Family health", person: "Amaka Nwosu", body: "Please pray for my mother as she continues her treatment.", status: "New", private: true, time: "Today · 8:46 AM" },
    { id: 2, kind: "Testimony", title: "God made a way", person: "Samuel Okoro", body: "After months of searching, I received a new job offer and I want to thank the church for praying with me.", status: "Review", private: false, time: "Yesterday · 4:20 PM" },
    { id: 3, kind: "Prayer request", title: "Wisdom for my family", person: "Grace Mensah", body: "Please keep my family in prayer as we make an important decision.", status: "Praying", private: true, time: "Jun 29 · 7:10 PM" },
    { id: 4, kind: "Testimony", title: "A peaceful recovery", person: "Esther Bello", body: "I am grateful for a healthy recovery and the support of my small group.", status: "Published", private: false, time: "Jun 27 · 11:32 AM" },
  ]);
  const liveItems = [...(prayerQuery.data ?? []).map(item => ({ id: item.id, kind: "Prayer request", title: item.title, person: "Member", body: item.request, status: item.status === "new" ? "New" : item.status === "praying" ? "Praying" : item.status === "answered" ? "Answered" : "Archived", private: Boolean(item.isPrivate), time: new Date(item.createdAt).toLocaleString() })), ...(testimonyQuery.data ?? []).map(item => ({ id: 100000 + item.id, kind: "Testimony", title: item.title, person: "Member", body: item.story, status: item.status === "submitted" ? "Review" : item.status === "published" ? "Published" : item.status, private: !Boolean(item.permissionToShare), time: new Date(item.createdAt).toLocaleString() }))];
  const visibleItems = liveItems.length > 0 ? liveItems : items;
  const filtered = filter === "All" ? visibleItems : visibleItems.filter(item => item.kind === filter);
  return <ModuleLayout eyebrow="CARE & FOLLOW-UP" title="Care inbox" description="Handle every prayer request and testimony with warmth, privacy, and clear follow-through." action="Send care note" onAction={() => toast.success("Care note composer opened", { description: "Choose a member and send a personal message." })}><div className="care-inbox-summary"><div><MessageSquareHeart size={17} /><span><strong>2</strong> new prayer requests</span></div><div><Sparkles size={17} /><span><strong>1</strong> testimony to review</span></div><div><Check size={17} /><span><strong>1</strong> published this month</span></div></div><div className="care-inbox-toolbar"><div><button className={filter === "All" ? "filter-chip active" : "filter-chip"} onClick={() => setFilter("All")}>All</button><button className={filter === "Prayer request" ? "filter-chip active" : "filter-chip"} onClick={() => setFilter("Prayer request")}>Prayer requests</button><button className={filter === "Testimony" ? "filter-chip active" : "filter-chip"} onClick={() => setFilter("Testimony")}>Testimonies</button></div><span>{filtered.length} records</span></div><div className="care-inbox-list">{filtered.map(item => <article className="care-inbox-item" key={item.id}><div className={`care-inbox-kind ${item.kind === "Testimony" ? "testimony-kind" : "prayer-kind"}`}>{item.kind === "Testimony" ? <Sparkles size={16} /> : <MessageSquareHeart size={16} />}</div><div className="care-inbox-body"><div className="care-inbox-title"><div><span className="eyebrow">{item.kind.toUpperCase()} · {item.time}</span><h3>{item.title}</h3></div><span className={`status-badge ${item.status === "Published" ? "status-green" : item.status === "New" ? "status-gold" : "status-gray"}`}>{item.status}</span></div><p>{item.body}</p><div className="care-inbox-footer"><span><Avatar initials={item.person.split(" ").map(part => part[0]).join("")} tone={item.kind === "Testimony" ? "amber" : "indigo"} small />{item.person}</span><span>{item.private ? <><LockKeyhole size={12} /> Private care record</> : <><Users size={12} /> Permission requested</>}</span><button onClick={() => { setItems(current => current.map(record => record.id === item.id ? { ...record, status: item.kind === "Testimony" ? "Published" : "Praying" } : record)); toast.success(item.kind === "Testimony" ? "Testimony marked for sharing" : "Prayer request moved to praying", { description: item.person }); }}>{item.kind === "Testimony" ? "Review testimony" : "Mark praying"}</button></div></div></article>)}</div></ModuleLayout>;
}

function ModuleLayout({ eyebrow, title, description, action, onAction, children }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return <section className="module-view"><div className="module-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button button-primary" onClick={onAction}><Plus size={17} />{action}</button></div>{children}</section>;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scope, setScope] = useState<number | "global">("global");
  const selectedBranch = scope === "global" ? null : branches.find(branch => branch.id === scope);
  const content = activeSection === "Overview" ? <Overview onNavigate={setActiveSection} scope={scope} /> : activeSection === "People" ? <PeopleView /> : activeSection === "Attendance" ? <AttendanceView /> : activeSection === "Giving" ? <GivingView /> : activeSection === "Projects" ? <ProjectView /> : activeSection === "Events" ? <EventsView /> : activeSection === "Communications" ? <CommunicationsView /> : activeSection === "Sermons" ? <SermonsView /> : activeSection === "Departments" ? <DepartmentsView /> : <CareInboxView />;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}><div className="brand"><span className="brand-mark"><span /></span><div><strong>ChurchFlow</strong><span>ADMIN CENTER</span></div><button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div><div className="workspace-switcher"><span className="workspace-avatar">HP</span><div><strong>Heirs of Promise Sanctuary</strong><span>5-branch network</span></div><ChevronDown size={15} /></div><nav className="main-nav"><span className="nav-label">WORKSPACE</span>{navItems.map(({ label, icon: Icon, badge }) => <button key={label} className={`nav-item ${activeSection === label ? "active" : ""}`} onClick={() => { setActiveSection(label); setMobileNavOpen(false); }}><Icon size={18} strokeWidth={activeSection === label ? 2.1 : 1.8} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}</nav><div className="sidebar-spacer" /><div className="sidebar-note"><Sparkles size={17} /><div><strong>Care is our system</strong><span>See the people behind the numbers.</span></div></div><button className="nav-item"><Settings2 size={18} /><span>Settings</span></button><div className="sidebar-profile"><Avatar initials="DS" tone="purple" /><div><strong>Dominique Somwe</strong><span>Administrator</span></div><MoreHorizontal size={17} /></div></aside>
    <main className="main-content"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Heirs of Promise Sanctuary</span><ChevronRight size={14} /><strong>{selectedBranch?.name ?? "Global view"}</strong><ChevronRight size={14} /><strong>{activeSection}</strong></div><div className="topbar-actions"><label className="select-button" aria-label="Choose branch scope"><GitBranch size={15} /><select value={scope} onChange={event => setScope(event.target.value === "global" ? "global" : Number(event.target.value))}><option value="global">All branches</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name} branch</option>)}</select></label><button className="global-search" onClick={() => toast.info("Search is ready", { description: "Try searching for a member, event, or giving record." })}><Search size={16} /><span>Search anything</span><kbd><Command size={12} /> K</kbd></button><button className="icon-button notification-button" onClick={() => toast.info("You’re all caught up", { description: "No new notifications." })}><Bell size={18} /><i /></button><div className="topbar-user"><Avatar initials="DS" tone="purple" small /><ChevronDown size={14} /></div></div></header><div className="page-content">{content}</div></main>
  </div>;
}
