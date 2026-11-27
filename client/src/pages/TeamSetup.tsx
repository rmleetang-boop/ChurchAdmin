import { useState, type FormEvent } from "react";
import ReportSharing from "./ReportSharing";
import { trpc } from "@/lib/trpc";
import {
  principals,
  roles,
  setupPlan,
  type Plan,
  type Role,
  type Rights,
} from "@shared/access";
import { teams, fields, type Team } from "@shared/reports";

type Grant = Plan["assignments"][number];
type Ticket = { email: string; scope: string; code: string };
const blank: Plan = { daniel: "", pway: "", assignments: [] };
const storage = "ghop-private-setup-plan-v1";
function initialPlan(): Plan {
  try {
    return JSON.parse(localStorage.getItem(storage) || "null") ?? blank;
  } catch {
    return blank;
  }
}
function Tickets({ items }: { items: Ticket[] }) {
  if (!items.length) return null;
  return (
    <section className="report-card">
      <h2>Private invitations</h2>
      <p>
        Give each code privately to the email owner. A code can be claimed once,
        after sign-in.
      </p>
      {items.map(t => (
        <p key={t.code}>
          {t.scope} · {t.email}
          <br />
          <code style={{ overflowWrap: "anywhere" }}>{t.code}</code>
        </p>
      ))}
    </section>
  );
}
function GrantForm({
  allowed,
  leader,
  save,
}: {
  allowed: readonly Team[];
  leader: boolean;
  save: (g: Grant) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await save({
        team: data.get("team") as Team,
        email: String(data.get("email")).trim().toLowerCase(),
        role: data.get("role") as Role,
      });
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save assignment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={add}>
      <div className="report-grid">
        <label>
          Department
          <select name="team">
            {allowed.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Team member email
          <input type="email" name="email" required maxLength={254} />
        </label>
        <label>
          Department role
          <select name="role">
            {roles
              .filter(r => !leader || r !== "Leader")
              .map(r => (
                <option key={r}>{r}</option>
              ))}
          </select>
        </label>
      </div>
      <button disabled={busy}>Save assignment</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function Setup({ apply = false }: { apply?: boolean }) {
  const [plan, setPlan] = useState<Plan>(initialPlan),
    [selected, setSelected] = useState<Team>("Finance"),
    [msg, setMsg] = useState(""),
    [tickets, setTickets] = useState<Ticket[]>([]);
  const bootstrap = trpc.teamAccess.bootstrap.useMutation();
  function change(next: Plan) {
    setPlan(next);
    try {
      localStorage.setItem(storage, JSON.stringify(next));
      setMsg("Setup draft saved on this device.");
    } catch {
      setMsg("Device storage unavailable. Export your setup to keep a copy.");
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ghop-setup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function activate() {
    try {
      const parsed = setupPlan.parse(plan);
      setTickets(await bootstrap.mutateAsync(parsed));
      setMsg("Setup activated. Share the invitations privately.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Setup could not be activated.");
    }
  }
  return (
    <>
      <h1>Set up GHOP</h1>
      <p>
        Prepare the church structure on this device. Assignments take effect
        when the church owner activates the setup.
      </p>
      <section className="report-card">
        <h2>Principal administrators</h2>
        <div className="report-grid">
          {(["daniel", "pway"] as const).map((k, i) => (
            <label key={k}>
              {principals[i]} · email
              <input
                type="email"
                autoComplete="off"
                value={plan[k]}
                onChange={e => change({ ...plan, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </section>
      <section className="report-card">
        <h2>Department team</h2>
        <p>
          Leaders submit reports and manage their own teams. Data capturers
          prepare drafts for leader review. Viewers can read their department’s
          reports.
        </p>
        <GrantForm
          allowed={teams}
          leader={false}
          save={async g =>
            change({
              ...plan,
              assignments: [
                ...plan.assignments.filter(
                  a => !(a.team === g.team && a.email === g.email)
                ),
                g,
              ],
            })
          }
        />
        {plan.assignments.map(a => (
          <p key={a.team + a.email}>
            {a.team} · {a.email} · {a.role}{" "}
            <button
              onClick={() =>
                change({
                  ...plan,
                  assignments: plan.assignments.filter(row => row !== a),
                })
              }
            >
              Remove
            </button>
          </p>
        ))}
      </section>
      <section className="report-card">
        <h2>Department layout</h2>
        <label>
          Preview department
          <select
            value={selected}
            onChange={e => setSelected(e.target.value as Team)}
          >
            {teams.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <h3>{selected} reporting fields</h3>
        <p>
          {[
            "Report date",
            "Activity",
            ...fields[selected],
            "Money received",
            "Money spent",
            "Needs or concerns",
            "Next action",
          ].join(" · ")}
        </p>
      </section>
      <button onClick={download}>Export setup draft</button>{" "}
      <label>
        Import completed setup
        <input
          type="file"
          accept=".json"
          onChange={async e => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              if (f.size > 250000) throw Error();
              change(setupPlan.parse(JSON.parse(await f.text())));
            } catch {
              setMsg(
                "Choose a valid GHOP setup file with both pastors’ emails."
              );
            }
          }}
        />
      </label>
      {apply && !tickets.length && (
        <button disabled={bootstrap.isPending} onClick={activate}>
          Activate church setup
        </button>
      )}
      <p role="status">{msg}</p>
      <Tickets items={tickets} />
    </>
  );
}
export function TeamManagement({ rights }: { rights: Rights }) {
  const allowed = teams.filter(
    t => rights.pastor || rights.roles[t] === "Leader"
  );
  const roster = trpc.teamAccess.roster.useQuery(undefined, {
    enabled: allowed.length > 0,
  });
  const grant = trpc.teamAccess.grant.useMutation(),
    revoke = trpc.teamAccess.revoke.useMutation();
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [msg, setMsg] = useState("");
  if (!allowed.length)
    return <p>Team management is available to your department leader.</p>;
  return (
    <>
      <h1>{rights.pastor ? "Church permissions" : "Department permissions"}</h1>
      {rights.pastor && <ReportSharing/>}
      <section className="report-card">
        <GrantForm
          allowed={allowed}
          leader={!rights.pastor}
          save={async a => {
            setTickets(await grant.mutateAsync(a));
            await roster.refetch();
            setMsg("Assignment saved.");
          }}
        />
      </section>
      <Tickets items={tickets} />
      <section className="report-card">
        <h2>Team access</h2>
        {roster.error && <p>{roster.error.message}</p>}
        {roster.data?.map(a => (
          <p key={a.id}>
            {a.team} · {a.email} · {a.role} · {a.active ? "Active" : "Invited"}{" "}
            {a.role !== "Principal" &&
              (rights.pastor || a.role !== "Leader") && (
                <button
                  disabled={revoke.isPending}
                  onClick={async () => {
                    try {
                      await revoke.mutateAsync(a.id);
                      await roster.refetch();
                      setMsg("Access removed.");
                    } catch (e) {
                      setMsg(
                        e instanceof Error
                          ? e.message
                          : "Could not remove access."
                      );
                    }
                  }}
                >
                  Remove access
                </button>
              )}
          </p>
        ))}
      </section>
      <p role="status">{msg}</p>
    </>
  );
}
export function ClaimInvitation() {
  const claim = trpc.teamAccess.claim.useMutation(),
    utils = trpc.useUtils();
  return (
    <details>
      <summary>Claim a team invitation</summary>
      <form
        onSubmit={async e => {
          e.preventDefault();
          const form = e.currentTarget;
          try {
            await claim.mutateAsync(
              String(new FormData(form).get("code")).trim()
            );
            form.reset();
            await utils.invalidate();
          } catch {
            /* shown below */
          }
        }}
      >
        <label>
          Private invitation code
          <input name="code" type="password" required autoComplete="off" />
        </label>
        <button disabled={claim.isPending}>Claim invitation</button>
        {claim.error && <p role="alert">{claim.error.message}</p>}
        {claim.isSuccess && <p>Access activated.</p>}
      </form>
    </details>
  );
}
