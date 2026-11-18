import { useState, type FormEvent } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
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
  onSaved,
}: {
  team: Team;
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
      setMessage("Report submitted.");
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
        <button>Submit report</button>
      </fieldset>
      {submit.error && <p role="alert">{submit.error.message}</p>}
      <p role="status">{message}</p>
    </form>
  );
}
function Workspace({
  pastor,
  permitted,
}: {
  pastor: boolean;
  permitted: Team[];
}) {
  const [choice, setChoice] = useState<Team | "Overview">(
    pastor ? "Overview" : permitted[0]
  );
  const [month, setMonth] = useState(today().slice(0, 7));
  const team = choice === "Overview" ? undefined : choice;
  const query = trpc.reports.list.useQuery(
    { month, team },
    { retry: false, enabled: !!choice }
  );
  const utils = trpc.useUtils();
  if (!choice)
    return (
      <section className="report-card">
        <h2>Department assignment pending</h2>
        <p>
          Your church administrator can assign your account to a department.
        </p>
      </section>
    );
  const rows = query.data ?? [];
  const reported = new Set(rows.map(r => r.team));
  const weeks = Array.from(new Set(rows.map(r => weekOf(r.day))));
  const finance = rows.filter(r => team || r.team === "Finance");
  const received = finance.reduce((sum, r) => sum + r.received, 0),
    spent = finance.reduce((sum, r) => sum + r.spent, 0);
  return (
    <>
      <header className="report-tools">
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
      {team && (
        <ReportForm
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
  const path = window.location.pathname;
  const loginReady = Boolean(
    import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID
  );
  return (
    <main className="ghop-reports">
      <nav>
        <b>GHOP</b>
        <span>God’s House of Prayer Ministries</span>
        {auth.user && (
          <>
            <a href="/">Reports</a>
            <a href="/member">Member workspace</a>
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
      {auth.loading ? (
        <p>Loading workspace…</p>
      ) : !auth.user ? (
        <section className="report-card">
          <h1>Church workspace</h1>
          <p>
            {loginReady
              ? "Sign in to open your workspace."
              : "Church sign-in is awaiting configuration."}
          </p>
          {loginReady && <button onClick={startLogin}>Sign in</button>}
        </section>
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
      ) : access.data ? (
        <Workspace pastor={access.data.pastor} permitted={access.data.teams} />
      ) : (
        <p>{access.error?.message ?? "Loading access…"}</p>
      )}
    </main>
  );
}
