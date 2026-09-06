import { describe, expect, it } from "vitest";
import { buildContributionReminder, calculateGrowthPercent, calculateProjectProgress, formatRand } from "../shared/churchflowMetrics";

describe("churchflow metrics", () => {
  it("calculates a rounded growth percentage", () => {
    expect(calculateGrowthPercent(864, 813)).toBe(6.3);
    expect(calculateGrowthPercent(100, 0)).toBe(100);
    expect(calculateGrowthPercent(0, 0)).toBe(0);
  });

  it("formats contribution amounts as South African rand", () => {
    expect(formatRand(6840000)).toMatch(/R.*6.*840.*000/);
    expect(formatRand(75000)).toMatch(/R.*75.*000/);
  });

  it("keeps project progress between zero and one hundred percent", () => {
    expect(calculateProjectProgress(2860000, 4500000)).toBe(64);
    expect(calculateProjectProgress(500, 100)).toBe(100);
    expect(calculateProjectProgress(50, 0)).toBe(0);
  });

  it("builds a reminder with the payment link included", () => {
    expect(buildContributionReminder("New auditorium chairs", "https://paystack.com/pay/chairs")).toContain("https://paystack.com/pay/chairs");
  });
});
