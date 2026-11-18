import { Setup, TeamManagement, ClaimInvitation } from "./TeamSetup";
import type { Rights } from "@shared/access";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Welcome from "./Welcome";
import { ArrowUpRight, Banknote, CalendarCheck, Handshake, Sparkles, Music, HeartHandshake, Coins, Sprout, Users, Flower2, Radio, Coffee, Flame, BookOpen, Mic, LayoutDashboard } from "lucide-react";
const teamIcons = { Finance: Banknote, Attendance: CalendarCheck, Usher: Handshake, Cleaning: Sparkles, Choir: Music, Charity: HeartHandshake, Fundraising: Coins, Youth: Sprout, Men: Users, Women: Flower2, Media: Radio, Hospitality: Coffee, Intercessor: Flame, "Sunday School": BookOpen, Moderation: Mic };
import { trpc } from "@/lib/trpc";
import {
  attendanceCount,
  fields,
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
  captureOnly,
  onSaved,
}: {
  team: Team;
  captureOnly: boolean;
  onSaved: (day: string) => void;
}) {
  const submit = trpc.reports.submit.useMutation();
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
        activity: value("activity"),
        details,
        needs: value("needs"),
        next: value("next"),
        received: cents("received"),
        spent: cents("spent"),
      });
      onSaved(value("day"));
      form.reset();
      setDetails({});
      setKey(crypto.randomUUID());
      setMessage(
        captureOnly ? "Draft saved for leader review." : "Report submitted."
      );
    } catch {
      /* Display the server response below. */
    }
  }
  return (
    <form className="report-card" onSubmit={save}>
      <h2>New {team} report</h2>
      <fieldset disabled={submit.isPending}>
        <div className="report-grid">
          <label>
            Report date
            <input type="date" name="day" required defaultValue={today()} />
          </label>
          <label>
            Service, meeting or activity
            <input name="activity" maxLength={200} required />
          </label>
          {fields[team].map(field => (
            <label key={field}>
              {field}
              {moneyFields.has(field) && " (R)"}
              {numberFields.has(field) || moneyFields.has(field) ? (
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
  const [choice, setChoice] = useState<Team | "Overview">();
  const [month, setMonth] = useState(today().slice(0, 7));
  const team = choice === "Overview" ? undefined : choice;
  const query = trpc.reports.list.useQuery(
    { month, team },
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
      {permitted.map(t=>{const Icon=teamIcons[t];return <button key={t} onClick={()=>setChoice(t)}><Icon/><span>{t}<small>{pastor?"Principal administrator":rights.roles[t]}</small></span><ArrowUpRight/></button>})}
    </div></section>;
  const rows = (query.data ?? []).filter(r => r.status === "submitted");
  const drafts = (query.data ?? []).filter(r => r.status === "draft");
  const reported = new Set(rows.map(r => r.team));
  const weeks = Array.from(new Set(rows.map(r => weekOf(r.day))));
  const finance = rows.filter(r => team || r.team === "Finance");
  const received = finance.reduce((sum, r) => sum + r.received, 0),
    spent = finance.reduce((sum, r) => sum + r.spent, 0);
  return (
    <>
      <header className="report-tools"><button onClick={()=>setChoice(undefined)}>All workspaces</button>
        <label>
          Workspace
          <select
            value={choice}
            onChange={e => setChoice(e.target.value as typeof choice)}
          >
            {pastor && <option>Overview</option>}
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
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </label>
      </header>
      <h1>{team ? team + " department" : "Pastoral dashboard"}</h1>
      {query.isLoading ? (
        <p>Loading reports…</p>
      ) : query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <>
          <div className="report-kpis">
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
          </div>
          {!team && (
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
                    {entries.length} reports · Net{" "}
                    {currency(
                      money.reduce((sum, r) => sum + r.received - r.spent, 0)
                    )}
                    {(!team ||
                      ["Attendance", "Usher", "Sunday School"].includes(
                        team
                      )) &&
                      " · Attendances recorded: " + attendance}
                  </p>
                  {(!team || team === "Finance") && (
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
      {team && (pastor || rights.roles[team] !== "Viewer") && (
        <ReportForm
          captureOnly={!pastor && rights.roles[team] === "Data capturer"}
          key={team}
          team={team}
          onSaved={day => {
            setMonth(day.slice(0, 7));
            void utils.reports.list.invalidate();
          }}
        />
      )}
    </>
  );
}
export default function Reports() {
  const auth = useAuth();
  const access = trpc.reports.access.useQuery(undefined, {
    enabled: !!auth.user,
    retry: false,
  });
  const ownerSetup = trpc.teamAccess.setupAvailable.useQuery(undefined, {
    enabled: !!auth.user,
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
        {auth.user && (
          <>
            <a href="/">Workspaces</a>
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
      {auth.user && <ClaimInvitation />}
      {path === "/setup" && (ownerSetup.data || access.data?.pastor) ? (
        <Setup apply={ownerSetup.data === true} />
      ) : path === "/member" ? (
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
      ) : access.data ? (
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
