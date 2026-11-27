import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Entry = {
  key: string;
  day: string;
  activity: string;
  status: string;
  details: Record<string, string>;
};
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function caption(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString("en-ZA", { ...options, timeZone: "UTC" });
}
export function ReportCalendar({
  day,
  today,
  entries,
  onDay,
  canWrite,
  loading,
  failed,
}: {
  day: string;
  today: string;
  entries: Entry[];
  onDay: (value: string) => void;
  canWrite: boolean;
  loading: boolean;
  failed: boolean;
}) {
  const date = new Date(day + "T12:00:00Z");
  const first = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  );
  const days = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const byDay = new Map<string, Entry[]>();
  for (const entry of [...entries].sort(
    (a, b) =>
      (a.details["Service time"] || "99").localeCompare(
        b.details["Service time"] || "99"
      ) || a.activity.localeCompare(b.activity)
  )) {
    const group = byDay.get(entry.day) ?? [];
    group.push(entry);
    byDay.set(entry.day, group);
  }
  function move(delta: number) {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + delta);
    onDay(next.toISOString().slice(0, 10));
  }
  const agenda = byDay.get(day) ?? [];
  return (
    <section
      className="report-card service-calendar"
      aria-label="Service calendar"
    >
      <header>
        <h2>{caption(first, { month: "long", year: "numeric" })}</h2>
        <div className="calendar-actions">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => onDay(today)}>
            Today
          </button>
          <button type="button" aria-label="Next month" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </header>
      <div className="calendar-days">
        {weekdays.map(d => (
          <span key={d}>{d}</span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <i key={"blank" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const value = day.slice(0, 7) + "-" + String(i + 1).padStart(2, "0"),
            items = byDay.get(value) ?? [];
          return (
            <button
              key={value}
              type="button"
              aria-current={value === today ? "date" : undefined}
              aria-pressed={value === day}
              aria-label={value + ", " + items.length + " reports"}
              onClick={() => onDay(value)}
            >
              <b>{i + 1}</b>
              {items.length > 0 && (
                <small>
                  {items[0].activity}
                  {items.length > 1 && " +" + (items.length - 1)}
                </small>
              )}
            </button>
          );
        })}
      </div>
      <div className="calendar-agenda">
        <h3>
          {caption(date, { weekday: "long", day: "numeric", month: "long" })}
        </h3>
        {failed ? (
          <p role="alert">Reports could not be loaded.</p>
        ) : loading ? (
          <p>Loading reports…</p>
        ) : agenda.length ? (
          agenda.map(entry => (
            <details key={entry.key}>
              <summary>
                {entry.details["Service time"] &&
                  entry.details["Service time"] + " · "}
                {entry.activity} ·{" "}
                {entry.status === "draft" ? "Draft" : "Submitted"}
              </summary>
              {Object.entries(entry.details)
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <p key={label}>
                    <b>{label === "Comments" ? "Report notes" : label}</b>
                    <br />
                    {value}
                  </p>
                ))}
            </details>
          ))
        ) : (
          <p>No reports for this day.</p>
        )}
        {canWrite && (
          <a
            href="#report-entry"
            onClick={() =>
              document
                .getElementById("report-service")
                ?.focus({ preventScroll: true })
            }
          >
            Enter report for this day →
          </a>
        )}
      </div>
    </section>
  );
}
