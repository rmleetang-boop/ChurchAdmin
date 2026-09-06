import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
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
  HandHeart,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Section = "Overview" | "People" | "Attendance" | "Giving" | "Events" | "Communications" | "Departments";

const navItems: { label: Section; icon: typeof LayoutDashboard; badge?: string }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "People", icon: UsersRound, badge: "1,248" },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Giving", icon: WalletCards },
  { label: "Events", icon: CalendarDays, badge: "4" },
  { label: "Communications", icon: MessageSquareText },
  { label: "Departments", icon: Users },
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
  { name: "Anonymous", type: "Offering", amount: "₦185,000", date: "Today, 9:42 AM", method: "Bank transfer", initials: "A", tone: "slate" },
  { name: "Tolu & Bisi Adebayo", type: "Tithe", amount: "₦120,000", date: "Today, 8:16 AM", method: "Card", initials: "TB", tone: "emerald" },
  { name: "Michael Okafor", type: "Building project", amount: "₦75,000", date: "Yesterday, 6:54 PM", method: "Bank transfer", initials: "MO", tone: "indigo" },
  { name: "Sarah Eze", type: "Offering", amount: "₦35,000", date: "Yesterday, 12:03 PM", method: "USSD", initials: "SE", tone: "rose" },
];

const departments = [
  { name: "Worship & Creative", lead: "Miriam Okafor", count: "28 people", color: "#6958d9", icon: Sparkles, progress: 84 },
  { name: "Children's Church", lead: "Daniel Adeyemi", count: "34 people", color: "#e49351", icon: HandHeart, progress: 72 },
  { name: "Welcome & Hospitality", lead: "Grace Mensah", count: "19 people", color: "#2c9b87", icon: UsersRound, progress: 91 },
  { name: "Media & Production", lead: "Samuel Okoro", count: "16 people", color: "#4a7cc9", icon: BookOpen, progress: 67 },
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

function Overview({ onNavigate }: { onNavigate: (section: Section) => void }) {
  return <>
    <section className="hero-row">
      <div><div className="eyebrow">Sunday, June 30, 2024 · Week 26</div><h1>Good morning, Pastor Daniel <span className="wave">✦</span></h1><p className="hero-copy">Here’s the pulse of <strong>Living Hope Assembly</strong>. You have a healthy week ahead.</p></div>
      <div className="hero-actions"><button className="button button-ghost"><Download size={16} />Export report</button><button className="button button-primary" onClick={() => toast.success("Quick record opened", { description: "Choose attendance, giving, member, or event." })}><Plus size={17} />Quick record</button></div>
    </section>
    <section className="metrics-grid">
      <MetricCard icon={Users} label="Total members" value="1,248" change="8.4%" tint="lavender" />
      <MetricCard icon={ClipboardCheck} label="Sunday attendance" value="864" change="6.2%" tint="mint" />
      <MetricCard icon={CircleDollarSign} label="Giving this month" value="₦6.84M" change="12.8%" tint="peach" />
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
      <div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">LIVE LEDGER</div><h2>Recent activity</h2></div><button className="icon-button"><Ellipsis size={18} /></button></div><div className="activity-list"><div className="activity-item"><span className="activity-icon activity-giving"><CircleDollarSign size={15} /></span><p><strong>₦185,000 offering</strong> received from Anonymous<span>Today, 9:42 AM</span></p></div><div className="activity-item"><span className="activity-icon activity-member"><UserPlus size={15} /></span><p><strong>Amaka Nwosu</strong> added as a visitor<span>Today, 9:10 AM</span></p></div><div className="activity-item"><span className="activity-icon activity-message"><Send size={15} /></span><p><strong>Welcome message</strong> sent to 12 first-time guests<span>Today, 8:30 AM</span></p></div><div className="activity-item"><span className="activity-icon activity-event"><CalendarDays size={15} /></span><p><strong>Leadership Summit</strong> updated by Miriam<span>Yesterday, 4:20 PM</span></p></div></div></div>
    </section>
  </>;
}

function PeopleView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => members.filter((member) => member.name.toLowerCase().includes(query.toLowerCase())), [query]);
  return <ModuleLayout eyebrow="PEOPLE DIRECTORY" title="People" description="Know your church family, keep every story current, and make follow-up personal." action="Add person" onAction={() => toast.success("New person form opened")}><div className="toolbar"><div className="search-field"><Search size={17} /><input placeholder="Search people by name..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="button button-ghost"><Filter size={16} />Filters</button><button className="button button-ghost"><Download size={16} />Export</button></div><div className="summary-strip"><div><span className="summary-label">Active members</span><strong>1,248</strong></div><div><span className="summary-label">Visitors this month</span><strong>86</strong></div><div><span className="summary-label">Needs follow-up</span><strong className="text-warm">18</strong></div></div><div className="table-panel"><div className="table-head"><span>Person</span><span>Group</span><span>Last activity</span><span>Status</span><span /></div>{filtered.map((member) => <div className="table-row" key={member.name}><div className="table-person"><Avatar initials={member.initials} tone={member.tone} small /><div><strong>{member.name}</strong><span>{member.detail}</span></div></div><span>{member.group}</span><span className="muted-cell">{member.name === "Amaka Nwosu" ? "Today" : "2 days ago"}</span><span className="status-badge status-green">Active</span><button className="icon-button"><MoreHorizontal size={17} /></button></div>)}</div></ModuleLayout>;
}

function AttendanceView() {
  return <ModuleLayout eyebrow="WEEKLY RHYTHM" title="Attendance" description="See who is showing up, where people are connecting, and what needs a gentle nudge." action="Record attendance" onAction={() => toast.success("Attendance recorder opened", { description: "Sunday service · June 30" })}><div className="attendance-tabs"><button className="tab-active">Sunday Service</button><button>Midweek Worship</button><button>Small Groups</button></div><div className="attendance-view-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">JUNE 30, 2024</div><h2>Sunday service check-in</h2></div><span className="status-badge status-green">Complete</span></div><div className="checkin-number"><strong>864</strong><span>checked in</span><div className="checkin-progress"><div style={{ width: "69%" }} /></div><small>69% of active members · Target 75%</small></div><div className="attendance-breakdown"><div><span className="breakdown-dot purple" /><strong>Adults</strong><b>612</b></div><div><span className="breakdown-dot coral" /><strong>Children</strong><b>184</b></div><div><span className="breakdown-dot gold" /><strong>First-time</strong><b>68</b></div></div></div><div className="panel"><div className="panel-heading"><div><div className="eyebrow">RETENTION SIGNAL</div><h2>Attendance trend</h2></div><TrendingUp size={19} className="icon-success" /></div><MiniBars /><div className="insight-card"><Sparkles size={16} /><span><strong>Good momentum.</strong> Attendance has grown for 4 weeks in a row.</span></div></div></div><div className="panel service-summary"><div className="panel-heading"><div><div className="eyebrow">SERVICE BREAKDOWN</div><h2>Where people connected</h2></div><button className="select-button">This month <ChevronDown size={15} /></button></div><div className="service-row"><span className="service-color service-purple" /><div><strong>In-person service</strong><small>Main auditorium · 10:00 AM</small></div><b>642</b><span className="service-percent">74%</span></div><div className="service-row"><span className="service-color service-blue" /><div><strong>Online service</strong><small>Livestream · 10:00 AM</small></div><b>154</b><span className="service-percent">18%</span></div><div className="service-row"><span className="service-color service-gold" /><div><strong>Children's church</strong><small>Upstairs hall · 10:00 AM</small></div><b>68</b><span className="service-percent">8%</span></div></div></ModuleLayout>;
}

function GivingView() {
  return <ModuleLayout eyebrow="STEWARDSHIP" title="Giving" description="A clear, accountable view of offerings, tithes, projects, and every contribution." action="Record giving" onAction={() => toast.success("Giving entry opened", { description: "Add amount, fund, and contributor details." })}><div className="giving-stat-grid"><div className="giving-stat featured"><span>This month</span><strong>₦6.84M</strong><small><ArrowUpRight size={14} />12.8% from May</small></div><div className="giving-stat"><span>Offering</span><strong>₦2.24M</strong><small>33% of total</small></div><div className="giving-stat"><span>Tithe</span><strong>₦3.76M</strong><small>55% of total</small></div><div className="giving-stat"><span>Projects</span><strong>₦840K</strong><small>12% of total</small></div></div><div className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">RECENT CONTRIBUTIONS</div><h2>Latest giving activity</h2></div><button className="button button-ghost">View report <ChevronRight size={15} /></button></div><div className="table-head giving-head"><span>Contributor</span><span>Fund</span><span>Amount</span><span>Date</span><span>Method</span></div>{givingRows.map((row) => <div className="table-row giving-row" key={`${row.name}-${row.amount}`}><div className="table-person"><Avatar initials={row.initials} tone={row.tone} small /><div><strong>{row.name}</strong><span>Receipt ready</span></div></div><span>{row.type}</span><strong className="amount-cell">{row.amount}</strong><span className="muted-cell">{row.date}</span><span className="method-cell">{row.method}</span></div>)}</div></ModuleLayout>;
}

function EventsView() {
  return <ModuleLayout eyebrow="CALENDAR & MOMENTS" title="Events" description="Bring every gathering, team, and moment of connection into one visible rhythm." action="Create event" onAction={() => toast.success("Event draft started", { description: "Add a title, date, and host to continue." })}><div className="event-toolbar"><div className="month-switcher"><button className="icon-button"><ChevronRight size={16} className="flip-x" /></button><strong>September 2024</strong><button className="icon-button"><ChevronRight size={16} /></button></div><div><button className="button button-ghost"><CalendarDays size={16} />Month view</button></div></div><div className="event-card-grid">{events.concat([{ day: "28", month: "SEP", title: "New Members Class", time: "Sat · 2:00 PM", type: "Growth", color: "green" }]).map((event) => <div className="event-card" key={event.title}><div className={`event-card-top event-${event.color}`}><div className="date-tile date-light"><strong>{event.day}</strong><span>{event.month}</span></div><span className="event-kind">{event.type}</span><button className="icon-button light"><MoreHorizontal size={18} /></button></div><div className="event-card-body"><h3>{event.title}</h3><p><Clock3 size={14} />{event.time}</p><div className="event-footer"><div className="mini-avatars"><Avatar initials="DA" tone="indigo" small /><Avatar initials="GM" tone="rose" small /><Avatar initials="+8" tone="slate" small /></div><span>12 attending</span></div></div></div>)}</div></ModuleLayout>;
}

function CommunicationsView() {
  const [sent, setSent] = useState(false);
  return <ModuleLayout eyebrow="KEEPING PEOPLE CLOSE" title="Communications" description="Share the right message with the right people, without losing the personal touch." action="New message" onAction={() => toast.success("Message composer ready")}><div className="communication-layout"><div className="panel message-list"><div className="panel-heading"><div><div className="eyebrow">RECENT CAMPAIGNS</div><h2>Messages</h2></div><button className="icon-button"><Filter size={17} /></button></div><div className="message-row selected"><span className="message-icon purple"><Send size={15} /></span><div><strong>Sunday service reminder</strong><span>Members · Sent today at 8:30 AM</span></div><span className="status-badge status-green">Sent</span></div><div className="message-row"><span className="message-icon blue"><Mail size={15} /></span><div><strong>Welcome to Living Hope</strong><span>First-time guests · Sent Jun 28</span></div><span className="status-badge status-green">Sent</span></div><div className="message-row"><span className="message-icon gold"><Clock3 size={15} /></span><div><strong>Leadership Summit update</strong><span>Leaders · Scheduled for Sep 10</span></div><span className="status-badge status-gold">Scheduled</span></div><div className="message-row"><span className="message-icon coral"><FileText size={15} /></span><div><strong>July prayer focus</strong><span>Draft · Last edited yesterday</span></div><span className="status-badge status-gray">Draft</span></div></div><div className="panel composer-panel"><div className="panel-heading"><div><div className="eyebrow">MESSAGE COMPOSER</div><h2>Write a new message</h2></div><span className="channel-badge"><MessageSquareText size={14} />SMS + Email</span></div><label>Audience<select defaultValue="All active members"><option>All active members</option><option>Leaders & department heads</option><option>First-time guests</option><option>Parents & guardians</option></select></label><label>Subject<input defaultValue="Sunday service reminder" /></label><label>Message<textarea defaultValue="Good morning, family. We look forward to worshipping with you this Sunday at 10:00 AM. Come expectant." /></label><div className="composer-footer"><span><span className="success-dot" />Estimated reach: <strong>1,248 people</strong></span><button className="button button-primary" onClick={() => { setSent(true); toast.success("Message scheduled", { description: "Your church family will receive it shortly." }); }}>{sent ? "Scheduled" : "Schedule message"}<Send size={15} /></button></div></div></div></ModuleLayout>;
}

function DepartmentsView() {
  return <ModuleLayout eyebrow="TEAMS & OWNERSHIP" title="Departments" description="Give every team clarity, a leader, and a simple way to stay aligned." action="Add department" onAction={() => toast.success("Department setup opened")}><div className="department-grid">{departments.map((department) => { const Icon = department.icon; return <div className="department-card" key={department.name}><div className="department-top"><span className="department-icon" style={{ backgroundColor: `${department.color}16`, color: department.color }}><Icon size={19} /></span><button className="icon-button"><MoreHorizontal size={17} /></button></div><h3>{department.name}</h3><p>Led by <strong>{department.lead}</strong></p><div className="department-bottom"><span>{department.count}</span><span>{department.progress}% active</span></div><div className="progress-track"><div style={{ width: `${department.progress}%`, backgroundColor: department.color }} /></div></div>})}<button className="department-card add-department" onClick={() => toast.success("Department setup opened")}><span className="add-circle"><Plus size={19} /></span><strong>Set up a department</strong><span>Create ownership and care teams</span></button></div></ModuleLayout>;
}

function ModuleLayout({ eyebrow, title, description, action, onAction, children }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return <section className="module-view"><div className="module-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button button-primary" onClick={onAction}><Plus size={17} />{action}</button></div>{children}</section>;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const content = activeSection === "Overview" ? <Overview onNavigate={setActiveSection} /> : activeSection === "People" ? <PeopleView /> : activeSection === "Attendance" ? <AttendanceView /> : activeSection === "Giving" ? <GivingView /> : activeSection === "Events" ? <EventsView /> : activeSection === "Communications" ? <CommunicationsView /> : <DepartmentsView />;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}><div className="brand"><span className="brand-mark"><span /></span><div><strong>ChurchFlow</strong><span>ADMIN CENTER</span></div><button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div><div className="workspace-switcher"><span className="workspace-avatar">LH</span><div><strong>Living Hope Assembly</strong><span>Central workspace</span></div><ChevronDown size={15} /></div><nav className="main-nav"><span className="nav-label">WORKSPACE</span>{navItems.map(({ label, icon: Icon, badge }) => <button key={label} className={`nav-item ${activeSection === label ? "active" : ""}`} onClick={() => { setActiveSection(label); setMobileNavOpen(false); }}><Icon size={18} strokeWidth={activeSection === label ? 2.1 : 1.8} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}</nav><div className="sidebar-spacer" /><div className="sidebar-note"><Sparkles size={17} /><div><strong>Care is our system</strong><span>See the people behind the numbers.</span></div></div><button className="nav-item"><Settings2 size={18} /><span>Settings</span></button><div className="sidebar-profile"><Avatar initials="PD" tone="purple" /><div><strong>Pastor Daniel</strong><span>Administrator</span></div><MoreHorizontal size={17} /></div></aside>
    <main className="main-content"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Living Hope Assembly</span><ChevronRight size={14} /><strong>{activeSection}</strong></div><div className="topbar-actions"><button className="global-search" onClick={() => toast.info("Search is ready", { description: "Try searching for a member, event, or giving record." })}><Search size={16} /><span>Search anything</span><kbd><Command size={12} /> K</kbd></button><button className="icon-button notification-button" onClick={() => toast.info("You’re all caught up", { description: "No new notifications." })}><Bell size={18} /><i /></button><div className="topbar-user"><Avatar initials="PD" tone="purple" small /><ChevronDown size={14} /></div></div></header><div className="page-content">{content}</div></main>
  </div>;
}
