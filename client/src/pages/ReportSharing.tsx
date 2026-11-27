import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { teams, type Team } from "@shared/reports";

export default function ReportSharing() {
  const [source, setSource] = useState<Team>("Charity");
  const [kind, setKind] = useState<"department" | "email">("department");
  const [recipient, setRecipient] = useState<Team>("Finance");
  const [email, setEmail] = useState("");
  const shares = trpc.reports.shares.useQuery();
  const utils = trpc.useUtils();
  const refresh = async () => {
    await Promise.all([
      shares.refetch(),
      utils.reports.access.invalidate(),
      utils.reports.list.invalidate(),
    ]);
  };
  const grant = trpc.reports.share.useMutation({ onSuccess: refresh });
  const remove = trpc.reports.unshare.useMutation({ onSuccess: refresh });
  return (
    <section className="report-card" id="report-sharing">
      <h2>Share a reporting dashboard</h2>
      <p>
        Give read-only access to a department’s submitted reports and monthly
        figures.
      </p>
      <form
        onSubmit={e => {
          e.preventDefault();
          grant.mutate(
            kind === "email"
              ? { source, kind, recipient: email }
              : { source, kind, recipient }
          );
        }}
      >
        <div className="report-grid">
          <label>
            Dashboard to share
            <select
              value={source}
              onChange={e => {
                const next = e.target.value as Team;
                setSource(next);
                if (next === recipient)
                  setRecipient(teams.find(t => t !== next)!);
              }}
            >
              {teams.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Share with
            <select
              value={kind}
              onChange={e => setKind(e.target.value as typeof kind)}
            >
              <option value="department">A department</option>
              <option value="email">An email address</option>
            </select>
          </label>
          {kind === "department" ? (
            <label>
              Receiving department
              <select
                value={recipient}
                onChange={e => setRecipient(e.target.value as Team)}
              >
                {teams
                  .filter(t => t !== source)
                  .map(t => (
                    <option key={t}>{t}</option>
                  ))}
              </select>
            </label>
          ) : (
            <label>
              Recipient email
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
          )}
        </div>
        <button disabled={grant.isPending}>Grant view access</button>
      </form>
      <h3>Current dashboard shares</h3>
      {shares.data?.length === 0 && <p>No dashboards shared yet.</p>}
      {shares.data?.map(s => (
        <p key={s.id}>
          {s.source} → {s.recipient} · Read only{" "}
          <button
            disabled={remove.isPending}
            onClick={() => remove.mutate(s.id)}
          >
            Revoke
          </button>
        </p>
      ))}
      <p role="status">
        {grant.error?.message ||
          remove.error?.message ||
          shares.error?.message ||
          (remove.isSuccess
            ? "Share removed."
            : grant.isSuccess
              ? "View access granted."
              : "")}
      </p>
    </section>
  );
}
