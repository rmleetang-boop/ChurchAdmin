import { expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportCalendar } from "../client/src/pages/ReportCalendar";
import { reportInput, teams } from "../shared/reports";
import { appRouter } from "./routers";
import * as access from "./teamAccess";
import type { TrpcContext } from "./_core/context";

it("renders leap day and sorts the day's services by time", () => {
  const props = {
    day: "2028-02-29",
    today: "2028-02-01",
    entries: ["18:00", "09:00"].map(time => ({
      key: time,
      day: "2028-02-29",
      activity: "Service at " + time,
      status: "submitted",
      details: { "Service time": time },
    })),
    onDay: () => {},
    canWrite: false,
    loading: false,
    failed: false,
  };
  const markup = renderToStaticMarkup(createElement(ReportCalendar, props));
  expect(markup).toContain("2028-02-29, 2 reports");
  expect(markup).not.toContain("2028-02-30");
  expect(markup.indexOf("Service at 09:00")).toBeLessThan(
    markup.indexOf("Service at 18:00")
  );
  expect(markup).not.toContain("Enter report for this day");
});
it("accepts notes and valid service times for every team", () => {
  for (const team of teams) {
    const row = {
      team,
      key: "0479bc9a-2b2e-42cb-a2fc-81f6c34b00f1",
      day: "2028-02-29",
      activity: "Evening service",
      details: { Comments: "Follow up.", "Service time": "18:30" },
      needs: "",
      next: "",
      received: 0,
      spent: 0,
    };
    expect(reportInput.safeParse(row).success).toBe(true);
    row.details["Service time"] = "25:30";
    expect(reportInput.safeParse(row).success).toBe(false);
  }
});
it("limits service history to authorised departments", async () => {
  const spy = vi
    .spyOn(access, "rightsFor")
    .mockResolvedValue({ pastor: false, roles: { Media: "Leader" } });
  try {
    await expect(
      appRouter
        .createCaller({ user: { openId: "media" } } as TrpcContext)
        .reports.services("Finance")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  } finally {
    spy.mockRestore();
  }
});
