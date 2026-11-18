import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";

export default function MemberHome() {
  const giving = trpc.member.givingHistory.useQuery(),
    attendance = trpc.attendance.history.useQuery(),
    prayers = trpc.member.prayerRequests.useQuery(),
    notifications = trpc.member.notifications.useQuery();
  const declare = trpc.attendance.declare.useMutation(),
    prayer = trpc.member.submitPrayer.useMutation(),
    testimony = trpc.member.submitTestimony.useMutation();
  const [status, setStatus] = useState("");
  async function save(
    e: FormEvent<HTMLFormElement>,
    kind: "attendance" | "prayer" | "testimony"
  ) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    const val = (k: string) => String(data.get(k) || "");
    setStatus("");
    try {
      if (kind === "attendance") {
        await declare.mutateAsync({
          serviceDate: new Date(val("day") + "T12:00:00Z"),
          response: val("response") as "attending" | "online" | "not_attending",
        });
        await attendance.refetch();
      } else if (kind === "prayer") {
        await prayer.mutateAsync({
          title: val("title"),
          request: val("message"),
          isPrivate: true,
          isAnonymous: data.has("anonymous"),
        });
        await prayers.refetch();
      } else
        await testimony.mutateAsync({
          title: val("title"),
          story: val("message"),
          permissionToShare: data.has("permission"),
        });
      form.reset();
      setStatus("Saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save.");
    }
  }
  return (
    <>
      <h1>Member workspace</h1>
      <p role="status">{status}</p>
      <section className="report-card">
        <h2>Attendance</h2>
        <form onSubmit={e => save(e, "attendance")}>
          <label>
            Service date
            <input name="day" required type="date" />
          </label>
          <label>
            Response
            <select name="response">
              <option value="attending">Attending</option>
              <option value="online">Online</option>
              <option value="not_attending">Unable to attend</option>
            </select>
          </label>
          <button disabled={declare.isPending}>Save response</button>
        </form>
        {attendance.data?.map(r => (
          <p key={r.id}>
            {r.serviceDate.toLocaleDateString()} · {r.response}
          </p>
        ))}
      </section>
      <section className="report-card">
        <h2>My giving</h2>
        {giving.data?.map(g => (
          <p key={g.id}>
            {g.createdAt.toLocaleDateString()} · R{g.amount}
          </p>
        ))}
        {giving.data?.length === 0 && <p>No contributions recorded.</p>}
      </section>
      <section className="report-card">
        <h2>Notifications</h2>
        {notifications.data?.map(n => (
          <p key={n.id}>
            <strong>{n.title}</strong> {n.body}
          </p>
        ))}
        {notifications.data?.length === 0 && <p>No notifications.</p>}
      </section>
      {(["prayer", "testimony"] as const).map(kind => (
        <section key={kind} className="report-card">
          <h2>
            {kind === "prayer" ? "Private prayer request" : "Share a testimony"}
          </h2>
          <form onSubmit={e => save(e, kind)}>
            <label>
              Title
              <input name="title" minLength={2} required />
            </label>
            <label>
              Message
              <textarea
                name="message"
                minLength={kind === "prayer" ? 5 : 10}
                required
              />
            </label>
            <label>
              <input
                type="checkbox"
                name={kind === "prayer" ? "anonymous" : "permission"}
              />
              {kind === "prayer"
                ? "Send anonymously"
                : "Allow the church to share this testimony"}
            </label>
            <button disabled={prayer.isPending || testimony.isPending}>
              Submit
            </button>
          </form>
          {kind === "prayer" &&
            prayers.data?.map(r => (
              <details key={r.id}>
                <summary>{r.title}</summary>
                <p>{r.request}</p>
                {r.replies.map(reply => (
                  <p key={reply.id}>{reply.message}</p>
                ))}
              </details>
            ))}
        </section>
      ))}
      {[giving, attendance, prayers, notifications].some(q => q.isError) && (
        <p role="alert">Some records could not be loaded.</p>
      )}
    </>
  );
}
