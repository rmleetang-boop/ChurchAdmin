import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PeopleDirectory from "@/components/people/PeopleDirectory";
import GivingInsights from "@/components/GivingInsights";
import CommandPalette from "@/components/CommandPalette";
import VolunteersView from "@/pages/VolunteersView";
import CareInbox from "@/components/CareInbox";
import { MEMBERS, TODAY } from "@/data/demo";
import { useLocation } from "wouter";
import { NAV_ITEMS, PASTOR_NAME } from "@/data/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import ChurchOverview from "./ChurchOverview";
import DepartmentsPage from "./DepartmentsPage";
import NotFound from "./NotFound";
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
  EyeOff,
  FileText,
  Filter,
  FolderKanban,
  GitBranch,
  HandHeart,
  HeartHandshake,
  Handshake,
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

type Section = "Overview" | "People" | "Attendance" | "Giving" | "Projects" | "Events" | "Communications" | "Sermons" | "Departments" | "Volunteers" | "Care inbox";

const navItems: { label: Section; icon: typeof LayoutDashboard; badge?: string }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "People", icon: UsersRound, badge: String(MEMBERS.length) },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Giving", icon: WalletCards },
  { label: "Projects", icon: FolderKanban, badge: "3" },
  { label: "Events", icon: CalendarDays, badge: "4" },
  { label: "Communications", icon: MessageSquareText },
  { label: "Sermons", icon: Mic, badge: "New" },
  { label: "Departments", icon: Users },
  { label: "Volunteers", icon: Handshake, badge: "New" },
  { label: "Care inbox", icon: HeartHandshake, badge: "4" },
];

const events = [
  { day: "14", month: "SEP", title: "Leadership Summit", time: "Sat · 9:00 AM", type: "Leadership", color: "violet" },
  { day: "18", month: "SEP", title: "Midweek Worship", time: "Wed · 6:30 PM", type: "Worship", color: "blue" },
  { day: "21", month: "SEP", title: "Community Outreach", time: "Sat · 10:00 AM", type: "Outreach", color: "amber" },
];

const givingRows = [
  { name: "Anonymous", type: "Offering", amount: "R185,000", date: "Today, 9:42 AM", method: "Bank transfer", initials: "A", tone: "slate" },
  { name: "Thabo & Naledi Mokoena", type: "Tithe", amount: "R120,000", date: "Today, 8:16 AM", method: "Card", initials: "TN", tone: "emerald" },
  { name: "Jean-Pierre Mukendi", type: "Building project", amount: "R75,000", date: "Yesterday, 6:54 PM", method: "Bank transfer", initials: "JM", tone: "indigo" },
  { name: "Lerato Dlamini", type: "Offering", amount: "R35,000", date: "Yesterday, 12:03 PM", method: "USSD", initials: "LD", tone: "rose" },
];

function Avatar({ initials, tone = "indigo", small = false }: { initials: string; tone?: string; small?: boolean }) {
  return <span className={`avatar avatar-${tone} ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

function MiniBars() {
  const bars = [38, 52, 45, 64, 58, 75, 69, 84, 76, 89, 82, 96];
  return <div className="mini-bars" aria-label="Attendance trend"><div className="goal-line" /><div className="bar-row">{bars.map((height, index) => <div key={index} className="bar-wrap"><div className={`bar ${index === bars.length - 1 ? "bar-active" : ""}`} style={{ height: `${height}%` }} /></div>)}</div><div className="chart-axis"><span>May 26</span><span>Jun 2</span><span>Jun 9</span><span>Jun 16</span><span>Jun 23</span><span>Jun 30</span></div></div>;
}

function PeopleView({ focusMemberId, onFocused }: { focusMemberId: number | null; onFocused: () => void }) {
  return <ModuleLayout eyebrow="PEOPLE DIRECTORY" title="People" description="Know your church family, keep every story current, and make follow-up personal." action="Add person" onAction={() => toast.success("New person form opened")}><PeopleDirectory focusMemberId={focusMemberId} onFocused={onFocused} /></ModuleLayout>;
}

function AttendanceView() {
  const [response, setResponse] = useState<"attending" | "online" | "not_attending" | null>(null);
  return <ModuleLayout eyebrow="WEEKLY RHYTHM" title="Attendance" description="See who is showing up, where people are connecting, and what needs a gentle nudge." action="Record attendance" onAction={() => toast.success("Attendance recorder opened", { description: "Sunday service · June 30" })}><div className="member-declaration"><div className="member-declaration-icon"><ClipboardCheck size={19} /></div><div><div className="eyebrow">MEMBER APP EXPERIENCE</div><h2>Let members declare attendance before service day</h2><p>Send a personal email or WhatsApp reminder with one-tap responses. Their answer helps teams prepare well.</p></div><div className="declaration-actions"><button className={response === "attending" ? "response-button chosen" : "response-button"} onClick={() => { setResponse("attending"); toast.success("Attendance declared", { description: "Attending in person" }); }}>I’m attending</button><button className={response === "online" ? "response-button chosen" : "response-button"} onClick={() => { setResponse("online"); toast.success("Attendance declared", { description: "Joining online" }); }}>Joining online</button><button className={response === "not_attending" ? "response-button muted chosen" : "response-button muted"} onClick={() => { setResponse("not_attending"); toast.success("Response saved", { description: "Not attending this Sunday" }); }}>Not this week</button></div></div><div className="attendance-tabs"><button className="tab-active">Sunday Service</button><button>Midweek Worship</button><button>Small Groups</button></div><div className="attendance-view-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">JUNE 30, 2024</div><h2>Sunday service check-in</h2></div><span className="status-badge status-green">Complete</span></div><div className="checkin-number"><strong>864</strong><span>checked in</span><div className="checkin-progress"><div style={{ width: "69%" }} /></div><small>69% of active members · Target 75%</small></div><div className="attendance-breakdown"><div><span className="breakdown-dot purple" /><strong>Adults</strong><b>612</b></div><div><span className="breakdown-dot coral" /><strong>Children</strong><b>184</b></div><div><span className="breakdown-dot gold" /><strong>First-time</strong><b>68</b></div></div></div><div className="panel"><div className="panel-heading"><div><div className="eyebrow">RETENTION SIGNAL</div><h2>Attendance trend</h2></div><TrendingUp size={19} className="icon-success" /></div><MiniBars /><div className="insight-card"><Sparkles size={16} /><span><strong>Good momentum.</strong> Attendance has grown for 4 weeks in a row.</span></div></div></div><div className="panel service-summary"><div className="panel-heading"><div><div className="eyebrow">SERVICE BREAKDOWN</div><h2>Where people connected</h2></div><button className="select-button">This month <ChevronDown size={15} /></button></div><div className="service-row"><span className="service-color service-purple" /><div><strong>In-person service</strong><small>Main auditorium · 10:00 AM</small></div><b>642</b><span className="service-percent">74%</span></div><div className="service-row"><span className="service-color service-blue" /><div><strong>Online service</strong><small>Livestream · 10:00 AM</small></div><b>154</b><span className="service-percent">18%</span></div><div className="service-row"><span className="service-color service-gold" /><div><strong>Children's church</strong><small>Upstairs hall · 10:00 AM</small></div><b>68</b><span className="service-percent">8%</span></div></div></ModuleLayout>;
}

function GivingView() {
  return <ModuleLayout eyebrow="STEWARDSHIP" title="Giving" description="A clear, accountable view of offerings, tithes, projects, and every contribution." action="Record giving" onAction={() => toast.success("Giving entry opened", { description: "Add amount, fund, and contributor details." })}><div className="giving-stat-grid"><div className="giving-stat featured"><span>This month</span><strong>R6.84M</strong><small><ArrowUpRight size={14} />12.8% from May</small></div><div className="giving-stat"><span>Offering</span><strong>R2.24M</strong><small>33% of total</small></div><div className="giving-stat"><span>Tithe</span><strong>R3.76M</strong><small>55% of total</small></div><div className="giving-stat"><span>Projects</span><strong>R840K</strong><small>12% of total</small></div></div><GivingInsights /><div className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">RECENT CONTRIBUTIONS</div><h2>Latest giving activity</h2></div><button className="button button-ghost">View report <ChevronRight size={15} /></button></div><div className="table-head giving-head"><span>Contributor</span><span>Fund</span><span>Amount</span><span>Date</span><span>Method</span></div>{givingRows.map((row) => <div className="table-row giving-row" key={`${row.name}-${row.amount}`}><div className="table-person"><Avatar initials={row.initials} tone={row.tone} small /><div><strong>{row.name}</strong><span>Receipt ready</span></div></div><span>{row.type}</span><strong className="amount-cell">{row.amount}</strong><span className="muted-cell">{row.date}</span><span className="method-cell">{row.method}</span></div>)}</div></ModuleLayout>;
}

type Project = { id: number; title: string; description: string; target: number; raised: number; status: "Active" | "Draft" | "Completed"; deadline: string; leader: string; branch: string; link: string };

function ProjectView() {
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, title: "New auditorium chairs", description: "Replace the main auditorium seating before the October thanksgiving service.", target: 4500000, raised: 2860000, status: "Active", deadline: "Oct 12, 2026", leader: PASTOR_NAME, branch: "Milnerton", link: "https://paystack.com/pay/heirs-promise-chairs" },
    { id: 2, title: "Children's church refresh", description: "Make the upstairs hall brighter, safer, and more welcoming for our children.", target: 1800000, raised: 1125000, status: "Active", deadline: "Sep 28, 2026", leader: "Naledi Mokoena", branch: "Bellville", link: "https://paystack.com/pay/heirs-promise-kids" },
    { id: 3, title: "Community food bank", description: "Monthly food support for 100 families in our neighborhood.", target: 1200000, raised: 1200000, status: "Completed", deadline: "Aug 31, 2026", leader: "Grâce Mutombo", branch: "Eastgate", link: "https://paystack.com/pay/heirs-promise-food" },
    { id: 4, title: "Building project", description: "Expand the Milnerton branch facilities to welcome more families and ministries.", target: 3000000, raised: 180000, status: "Active", deadline: "Mar 31, 2025", leader: "Pastor Pascale Kolesha Avenvuka", branch: "Milnerton", link: "https://paystack.com/pay/heirs-promise-milnerton-building" },
  ]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [contributing, setContributing] = useState<Project | null>(null);
  const [amount, setAmount] = useState("50000");
  const [form, setForm] = useState({ title: "", description: "", target: "2500000", deadline: "Dec 20, 2024", link: "" });
  const openCreate = () => { setEditing({ id: 0, title: "", description: "", target: 2500000, raised: 0, status: "Draft", deadline: "Dec 20, 2026", leader: PASTOR_NAME, branch: "Milnerton", link: "" }); setForm({ title: "", description: "", target: "2500000", deadline: "Dec 20, 2026", link: "" }); };
  const saveProject = () => { if (!form.title.trim()) return toast.error("Add a project name first"); const next: Project = { id: editing?.id || Date.now(), title: form.title, description: form.description || "A new church project with a clear goal and accountable progress.", target: Number(form.target) || 0, raised: editing?.raised || 0, status: editing?.status || "Draft", deadline: form.deadline, leader: PASTOR_NAME, branch: editing?.branch || "Milnerton", link: form.link || "https://paystack.com/pay/heirs-promise-project" }; setProjects(current => editing?.id ? current.map(project => project.id === editing.id ? next : project) : [next, ...current]); setEditing(null); toast.success(editing?.id ? "Project updated" : "Project created", { description: "Your project is ready for contributions." }); };
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

function SermonsView() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Sunday worship — Living with courage");
  const [preacher, setPreacher] = useState(PASTOR_NAME);
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
  return <ModuleLayout eyebrow="CARE & FOLLOW-UP" title="Care inbox" description="Handle every prayer request and testimony with warmth, privacy, and clear follow-through." action="Send care note" onAction={() => toast.success("Care note composer opened", { description: "Choose a member and send a personal message." })}><CareInbox /></ModuleLayout>;
}

function ModuleLayout({ eyebrow, title, description, action, onAction, children }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return <section className="module-view"><div className="module-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button button-primary" onClick={onAction}><Plus size={17} />{action}</button></div>{children}</section>;
}

function VolunteersPage() {
  return <ModuleLayout eyebrow="SERVING TOGETHER" title="Volunteers" description="Every team, every Sunday, every role covered — with reminders that make confirming effortless." action="Add volunteer" onAction={() => toast.success("Volunteer form opened")}><VolunteersView /></ModuleLayout>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const activeSection = NAV_ITEMS.find(item => item.path === location)?.label;
  const setActiveSection = useCallback((section: Section) => setLocation(NAV_ITEMS.find(item => item.label === section)!.path), [setLocation]);
  const [scope, setScope] = useState<number | "global">("global");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [focusMemberId, setFocusMemberId] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(v => !v); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMember = useCallback((id: number) => { setFocusMemberId(id); setActiveSection("People"); }, [setActiveSection]);
  const navigate = useCallback((s: string) => setActiveSection(s as Section), [setActiveSection]);
  const clearFocus = useCallback(() => setFocusMemberId(null), []);

  if (!activeSection) return <NotFound />;
  const content = activeSection === "Overview" ? <ChurchOverview onNavigate={setActiveSection} scope={scope} onOpenMember={openMember} /> : activeSection === "People" ? <PeopleView focusMemberId={focusMemberId} onFocused={clearFocus} /> : activeSection === "Attendance" ? <AttendanceView /> : activeSection === "Giving" ? <GivingView /> : activeSection === "Projects" ? <ProjectView /> : activeSection === "Events" ? <EventsView /> : activeSection === "Communications" ? <CommunicationsView /> : activeSection === "Sermons" ? <SermonsView /> : activeSection === "Departments" ? <DepartmentsPage scope={scope} onScope={setScope} /> : activeSection === "Volunteers" ? <VolunteersPage /> : <CareInboxView />;
  return <DashboardShell activeSection={activeSection} scope={scope} onScope={setScope} onSearch={() => setPaletteOpen(true)} onNavigate={setActiveSection}>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} sections={navItems.map(n => n.label)} onNavigate={navigate} onOpenMember={openMember} />
    {content}
  </DashboardShell>;
}
