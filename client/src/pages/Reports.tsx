import { Setup, TeamManagement, ClaimInvitation } from "./TeamSetup";
import type { Rights } from "@shared/access";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ProfileForm, { MemberLookup } from "./Profile";
import { ReportCalendar } from "./ReportCalendar";
import Welcome from "./Welcome";
import { ArrowUpRight, Banknote, CalendarCheck, Handshake, Sparkles, Music, HeartHandshake, Coins, Sprout, Users, Flower2, Radio, Coffee, Flame, BookOpen, Mic, LayoutDashboard } from "lucide-react";
const teamIcons = { Finance: Banknote, Attendance: CalendarCheck, Usher: Handshake, Cleaning: Sparkles, Choir: Music, Charity: HeartHandshake, Fundraising: Coins, Youth: Sprout, Men: Users, Women: Flower2, Media: Radio, Hospitality: Coffee, Intercessor: Flame, "Sunday School": BookOpen, Moderation: Mic };
import { trpc } from "@/lib/trpc";
import {
  attendanceCount,
  fields,
  dateFields,
  moneyFields,
  numberFields,
  teams,
  weekOf,
  type Team,
} from "@shared/reports";
import "./reports.css";
import CareInbox from "@/components/CareInbox";
import DepartmentsPage from "./DepartmentsPage";
import MemberHome from "./MemberHome";
import Sermons from "./Sermons";
import WhatsAppAutomation from "./WhatsAppAutomation";

const currency = (cents: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
    cents / 100
  );
const today = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Africa/Johannesburg" });

function FinanceBreakdown({
  entries,
}: {
  entries: {
    received: number;
    spent: number;
    details: Record<string, string>;
  }[];
}) {
  const sums = new Map<
    string,
    { incoming: number; outgoing: number; allocated: number }
  >();
  function add(
    category: string,
    key: "incoming" | "outgoing" | "allocated",
    amount: number
  ) {
    if (!amount) return;
    const label = category?.trim() || "Uncategorised";
    const row = sums.get(label) ?? { incoming: 0, outgoing: 0, allocated: 0 };
    row[key] += amount;
    sums.set(label, row);
  }
  for (const entry of entries) {
    add(entry.details["Receipts category"], "incoming", entry.received);
    add(entry.details["Expense category"], "outgoing", entry.spent);
    add(
      entry.details["Allocation destination"] ||
        entry.details["Allocation purpose"],
      "allocated",
      Math.round(Number(entry.details["Amount allocated"] || 0) * 100)
    );
  }
  if (!sums.size) return null;
  return (
    <div className="report-table">
      <table>
        <caption>Weekly finance breakdown</caption>
        <thead>
          <tr>
            <th>Category or destination</th>
            <th>Received</th>
            <th>Spent</th>
            <th>Allocated</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(sums, ([label, row]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{currency(row.incoming)}</td>
              <td>{currency(row.outgoing)}</td>
              <td>{currency(row.allocated)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ReportForm({
  team,
  captureOnly, day, onDay, existing,
  onSaved,
}: {
  team: Team;
  captureOnly: boolean; day:string; onDay:(day:string)=>void; existing:{activity:string;day:string}[];
  onSaved: (day: string) => void;
}) {
  const submit = trpc.reports.submit.useMutation();
  const trpcUtils=trpc.useUtils();
  const services=trpc.reports.services.useQuery(team,{retry:false});
  const [service,setService]=useState("");
  const [custom,setCustom]=useState("");
  const activity = service==="custom" ? custom.trim() : service.slice(2);
  const choices=Array.from(new Set([...(services.data??[]),"Sunday service","Prayer meeting","Bible study","Department meeting",...(team==="Choir"?["Choir rehearsal"]:team==="Sunday School"?["Sunday School class"]:[])]));
  const duplicate=!!activity && existing.some(e=>e.day===day && e.activity.trim().toLowerCase()===activity.toLowerCase());
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) || "");
    const cents = (name: string) => Math.round(Number(value(name)) * 100);
    setMessage("");
    try {
      await submit.mutateAsync({
        key,
        team,
        day: value("day"),
        activity,
        details,
        needs: value("needs"),
        next: value("next"),
        received: cents("received"),
        spent: cents("spent"),
      });
      void trpcUtils.reports.services.invalidate(team);
      onSaved(value("day"));
      form.reset();
      setDetails({});setService("");setCustom("");
      setKey(crypto.randomUUID());
      setMessage(
        captureOnly ? "Draft saved for leader review." : "Report submitted."
      );
    } catch {
      /* Display the server response below. */
    }
  }
  return (
    <form className="report-card" id="report-entry" onSubmit={save}>
      <h2>New {team} report</h2>
      <fieldset disabled={submit.isPending}>
        <div className="report-grid">
          <label>
            Report date
            <input type="date" name="day" required value={day} onChange={e=>{if(e.target.value)onDay(e.target.value)}} />
          </label>
          <label>
            Service, meeting or activity
            <select id="report-service" value={service} onChange={e=>setService(e.target.value)} required><option value="">Select a service</option>{choices.map(name=><option key={name} value={"s:"+name}>{name}</option>)}<option value="custom">Other — enter a name</option></select>
          </label>
          {service==="custom" && <label>Service or activity name<input maxLength={200} required value={custom} onChange={e=>setCustom(e.target.value)}/></label>}
          <label>Service time<input type="time" value={details["Service time"]??""} onChange={e=>setDetails({...details,"Service time":e.target.value})}/></label>
          {duplicate && <p role="status">A report already exists for this service on this date. You can still record a separate session.</p>}
          {fields[team].filter(f=>!["Comments","Service time","Service or gathering"].includes(f)).map(field => (
            <label key={field}>
              {field}
              {moneyFields.has(field) && " (R)"}
              {dateFields.has(field) ? <input type="date" value={details[field] ?? ""} onChange={e=>setDetails({...details,[field]:e.target.value})}/> : numberFields.has(field) || moneyFields.has(field) ? (
                <input
                  type="number"
                  min="0"
                  max="9999999"
                  step={moneyFields.has(field) ? ".01" : "1"}
                  value={details[field] ?? ""}
                  onChange={e =>
                    setDetails({ ...details, [field]: e.target.value })
                  }
                />
              ) : (
                <textarea
                  rows={2}
                  maxLength={1500}
                  value={details[field] ?? ""}
                  onChange={e =>
                    setDetails({ ...details, [field]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
          {fields[team].includes("Men present") && (
            <p>
              Attendance total <strong>{attendanceCount(details)}</strong>
            </p>
          )}
          <label>
            Money received (R)
            <input
              type="number"
              min="0"
              step=".01"
              max="9999999.99"
              name="received"
            />
          </label>
          <label>
            Money spent (R)
            <input
              type="number"
              min="0"
              step=".01"
              max="9999999.99"
              name="spent"
            />
          </label>
          <label>
            Needs or concerns
            <textarea name="needs" maxLength={2000} />
          </label>
          <label>
            Next action
            <textarea name="next" maxLength={2000} />
          </label>
        </div>
        <label className="entry-notes">Report notepad<textarea rows={5} maxLength={1500} placeholder="Record observations, decisions or follow-up details…" value={details.Comments??""} onChange={e=>setDetails({...details,Comments:e.target.value})}/><small>Saved with this report · {(details.Comments??"").length}/1500</small></label>
        <button>
          {captureOnly ? "Save draft for review" : "Submit report"}
        </button>
      </fieldset>
      {submit.error && <p role="alert">{submit.error.message}</p>}
      <p role="status">{message}</p>
    </form>
  );
}
function Workspace({
  pastor,
  permitted,
  rights,
}: {
  pastor: boolean;
  permitted: Team[];
  rights: Rights;
}) {
  const [choice, setChoice] = useState<Team | "Overview" | "Integrated">();
  const [tab,setTab]=useState<"dashboard"|"entry">("dashboard");
  function navigate(next: typeof choice) { setChoice(next); setTab("dashboard"); }
  const [day,setDay]=useState(today);
  const month=day.slice(0,7);
  const team = choice === "Overview" || choice === "Integrated" ? undefined : choice;
  const query = trpc.reports.list.useQuery(
    { month, team, combined: choice === "Integrated" },
    { retry: false, enabled: !!choice }
  );
  const utils = trpc.useUtils();
  const approve = trpc.reports.approve.useMutation();
  if (!choice && !permitted.length && !pastor)
    return (
      <section className="report-card">
        <h2>Department assignment pending</h2>
        <p>
          Your church administrator can assign your account to a department.
        </p>
      </section>
    );
  if (!choice) return <section className="department-home">
    <h1>Your workspace</h1><p>Select a department to open its reports.</p>
    <div className="department-tiles">
      {pastor && <button className="pastoral-tile" onClick={()=>setChoice("Overview")}><LayoutDashboard/><span>Pastoral dashboard<small>Church-wide reports</small></span><ArrowUpRight/></button>}
      {!pastor && permitted.length>1 && <button className="pastoral-tile" onClick={()=>navigate("Integrated")}><LayoutDashboard/><span>Integrated dashboard<small>Compare accessible departments</small></span><ArrowUpRight/></button>}
      {permitted.map(t=>{const Icon=teamIcons[t];return <button key={t} onClick={()=>navigate(t)}><Icon/><span>{t}<small>{pastor?"Principal administrator":rights.roles[t]??"Shared dashboard · Read only"}</small></span><ArrowUpRight/></button>})}
    </div></section>;
  const rows = (query.data ?? []).filter(r => r.status === "submitted");
  const drafts = (query.data ?? []).filter(r => r.status === "draft");
  const reported = new Set(rows.map(r => r.team));
  const weeks = Array.from(new Set(rows.map(r => weekOf(r.day))));
  const canWrite = !!team && (pastor || rights.roles[team]==="Leader" || rights.roles[team]==="Data capturer");
  const finance = rows.filter(r => team || r.team === "Finance");
  const received = finance.reduce((sum, r) => sum + r.received, 0),
    spent = finance.reduce((sum, r) => sum + r.spent, 0);
  return (
    <>
      <header className="report-tools"><button onClick={()=>navigate(undefined)}>All workspaces</button>
        <label>
          Workspace
          <select
            value={choice}
            onChange={e => navigate(e.target.value as typeof choice)}
          >
            {pastor && <option>Overview</option>}{!pastor && permitted.length>1 && <option>Integrated</option>}
            {permitted.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Reporting month
          <input
            type="month"
            required
            value={month}
            onChange={e => {
              if (e.target.value) setDay(e.target.value+"-01");
            }}
          />
        </label>
      </header>
      <h1>{team ? team + " department" : choice === "Integrated" ? "Integrated dashboard" : "Pastoral dashboard"}</h1>
      {team && <div className="report-tabs"><button aria-pressed={tab==="dashboard"} onClick={()=>setTab("dashboard")}>Reporting dashboard</button>{canWrite && <button aria-pressed={tab==="entry"} onClick={()=>setTab("entry")}>Data entry</button>}{!rights.roles[team] && !pastor && <small>Shared dashboard · Read only</small>}</div>}
      {tab==="entry" && canWrite && <ReportCalendar day={day} today={today()} entries={query.data??[]} canWrite onDay={setDay} loading={query.isLoading} failed={query.isError}/>}
      {tab==="dashboard" && (<>
      {query.isLoading ? (
        <p>Loading reports…</p>
      ) : query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <>
          {choice==="Integrated" && <section className="report-card"><h2>Department comparison</h2><div className="report-table"><table><thead><tr>{["Department","Submitted","Received","Spent","Net"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{permitted.map(t=>{
            const entries=rows.filter(r=>r.team===t), income=entries.reduce((n,r)=>n+r.received,0), expenses=entries.reduce((n,r)=>n+r.spent,0);
            return <tr key={t}><th><button onClick={()=>navigate(t)}>{t}</button></th><td>{entries.length}</td><td>{currency(income)}</td><td>{currency(expenses)}</td><td>{currency(income-expenses)}</td></tr>;
          })}</tbody></table></div></section>}
          {choice!=="Integrated" && <div className="report-kpis">
            {(!team || fields[team].includes("Children present")) && (
              <div>
                <small>Attendance recorded</small>
                <strong>
                  {rows
                    .filter(r => r.team === (team ?? "Attendance"))
                    .reduce((sum, r) => sum + attendanceCount(r.details), 0)}
                </strong>
              </div>
            )}
            <div>
              <small>Reports submitted</small>
              <strong>{rows.length}</strong>
            </div>
            <div>
              <small>{team ? "Department" : "Finance"} receipts</small>
              <strong>{currency(received)}</strong>
            </div>
            <div>
              <small>Expenses</small>
              <strong>{currency(spent)}</strong>
            </div>
            <div>
              <small>Net movement</small>
              <strong>{currency(received - spent)}</strong>
            </div>
            {team && fields[team].filter(f=>numberFields.has(f)||moneyFields.has(f)).map(f=>{
              const values=rows.flatMap(r=>r.details[f] ? [Number(r.details[f])] : []);
              const total=values.reduce((a,b)=>a+b,0);
              return <div key={f}><small>{f}</small><strong>{values.length ? (moneyFields.has(f)?currency(Math.round(total*100)):total) : "—"}</strong></div>;
            })}
          </div>}
          {choice==="Overview" && (
            <section className="report-card">
              <h2>Awaiting a report</h2>
              <p>
                {teams.filter(t => !reported.has(t)).join(" · ") ||
                  "All departments have reported."}
              </p>
              <h2>Needs raised</h2>
              {rows
                .filter(r => r.needs)
                .map(r => (
                  <p key={r.key}>
                    <strong>{r.team}</strong> · {r.day} · {r.needs}
                  </p>
                ))}
              {!rows.some(r => r.needs) && <p>No needs reported this month.</p>}
            </section>
          )}
          <section className="report-card">
            <h2>Weekly reports</h2>
            {!rows.length && <p>No reports submitted for this month.</p>}
            {weeks.map(week => {
              const entries = rows.filter(r => weekOf(r.day) === week);
              const attendance = entries
                .filter(r => r.team === (team ?? "Attendance"))
                .reduce((sum, r) => sum + attendanceCount(r.details), 0);
              const money = entries.filter(r => team || r.team === "Finance");
              return (
                <section key={week}>
                  <h3>Week of {week}</h3>
                  <p>
                    {entries.length} reports {choice !== "Integrated" && <>· Net{" "}
                    {currency(
                      money.reduce((sum, r) => sum + r.received - r.spent, 0)
                    )}</>}
                    {choice !== "Integrated" && (!team ||
                      ["Attendance", "Usher", "Sunday School"].includes(
                        team
                      )) &&
                      " · Attendances recorded: " + attendance}
                  </p>
                  {choice !== "Integrated" && (!team || team === "Finance") && (
                    <FinanceBreakdown entries={money} />
                  )}
                  {entries.map(r => (
                    <details key={r.key}>
                      <summary>
                        {r.day} · {r.team} · {r.activity}
                      </summary>
                      <dl>
                        {Object.entries(r.details).map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                        <div>
                          <dt>Received / spent</dt>
                          <dd>
                            {currency(r.received)} / {currency(r.spent)}
                          </dd>
                        </div>
                        {r.needs && (
                          <div>
                            <dt>Needs</dt>
                            <dd>{r.needs}</dd>
                          </div>
                        )}
                        {r.next && (
                          <div>
                            <dt>Next action</dt>
                            <dd>{r.next}</dd>
                          </div>
                        )}
                      </dl>
                    </details>
                  ))}
                </section>
              );
            })}
          </section>
        </>
      )}
      </>)}
      {team && drafts.length > 0 && (
        <section className="report-card">
          <h2>Drafts awaiting submission</h2>
          {drafts.map(r => (
            <details key={r.key}>
              <summary>
                {r.day} · {r.activity}
              </summary>
              {Object.entries(r.details).map(([k, v]) => (
                <p key={k}>
                  {k}: {v}
                </p>
              ))}
              <p>
                Received {currency(r.received)} · Spent {currency(r.spent)}
              </p>
              <p>{r.needs}</p>
              <p>{r.next}</p>
              {(pastor || rights.roles[team] === "Leader") && (
                <button
                  disabled={approve.isPending}
                  onClick={() =>
                    approve.mutate(
                      { key: r.key, team },
                      { onSuccess: () => void utils.reports.list.invalidate() }
                    )
                  }
                >
                  Submit to pastors
                </button>
              )}
            </details>
          ))}
          {approve.error && <p>{approve.error.message}</p>}
        </section>
      )}
      {team && canWrite && tab==="entry" && (
        <ReportForm day={day} onDay={setDay} existing={query.data??[]}
          captureOnly={!pastor && rights.roles[team] === "Data capturer"}
          key={team}
          team={team}
          onSaved={day => {
            setDay(day);
            if (pastor || rights.roles[team]==="Leader") setTab("dashboard");
            void utils.reports.list.invalidate();
          }}
        />
      )}
    </>
  );
}
export default function Reports() {
  const auth = useAuth();
  const profile = trpc.profiles.mine.useQuery(undefined,{enabled:!!auth.user,retry:false});
  const access = trpc.reports.access.useQuery(undefined, {
    enabled: !!auth.user && !!profile.data,
    retry: false,
  });
  const ownerSetup = trpc.teamAccess.setupAvailable.useQuery(undefined, {
    enabled: !!auth.user && !!profile.data,
    retry: false,
  });
  const path = window.location.pathname;
  if (auth.loading) return <main className="login-loading" role="status">Opening your workspace…</main>;
  if (!auth.user) return <Welcome onLogin={() => { void auth.refresh(); }} />;
  return (
    <main className="ghop-reports">
      <nav>
        <img width="48" height="48" src="/ghop-emblem.png" alt="GHOP"/>
        <span>God’s House of Prayer Ministries</span>
        {(ownerSetup.data || access.data?.pastor) && <a href="/setup">Church setup</a>}
        {profile.data && (
          <>
            <a href="/profile">My profile</a>
            <a href="/">Workspaces</a>
            {auth.user.designation === "Technical administrator" && <a href="/departments">Technical administration</a>}
            <a href="/member">Member workspace</a>
            {access.data &&
              (access.data.pastor ||
                Object.values(access.data.roles).includes("Leader")) && (
                <a href="/permissions">Team permissions</a>
              )}
            {access.data?.pastor && (
              <>
                {auth.user.role === "admin" && (
                  <>
                    <a href="/departments">Departments</a>
                    <a href="/care">Care inbox</a>
                  </>
                )}
                <a href="/records">Member records</a>
                <a href="/sermons">Sermons</a>
                <a href="/whatsapp-automation">WhatsApp</a>
              </>
            )}
          </>
        )}
        {auth.user && (
          <button
            onClick={() => void auth.logout().then(() => location.reload())}
          >
            Sign out
          </button>
        )}
      </nav>
      {profile.data && <ClaimInvitation />}
      {profile.isError ? <section className="report-card" role="alert"><p>{profile.error.message}</p><button onClick={()=>void profile.refetch()}>Try again</button></section> : profile.isPending ? <p>Opening your profile…</p> : !profile.data || path === "/profile" ? (
        <ProfileForm profile={profile.data} email={auth.user.email ?? ""} onSaved={async()=>{await profile.refetch();}}/>
      ) : path === "/setup" && (ownerSetup.data || access.data?.pastor) ? (
        <Setup apply={ownerSetup.data === true} />
      ) : auth.user.designation === "Technical administrator" && ["/","/departments"].includes(path) ? <><h1>Technical administration</h1><DepartmentsPage scope="global" onScope={()=>{}}/></> : access.data?.pastor && path === "/records" ? <MemberLookup/> : path === "/member" ? (
        <MemberHome />
      ) : access.data?.pastor &&
        auth.user.role === "admin" &&
        path === "/departments" ? (
        <DepartmentsPage scope="global" onScope={() => {}} />
      ) : access.data?.pastor &&
        auth.user.role === "admin" &&
        path === "/care" ? (
        <CareInbox />
      ) : access.data?.pastor && path === "/sermons" ? (
        <Sermons />
      ) : access.data?.pastor && path === "/whatsapp-automation" ? (
        <WhatsAppAutomation />
      ) : access.data && path === "/permissions" ? (
        <TeamManagement rights={access.data} />
      ) : access.data && !access.data.pastor && !access.data.teams.length ? <MemberHome /> : access.data ? (
        <Workspace
          rights={access.data}
          pastor={access.data.pastor}
          permitted={access.data.teams}
        />
      ) : (
        <p>{access.error?.message ?? "Loading access…"}</p>
      )}
    </main>
  );
}
