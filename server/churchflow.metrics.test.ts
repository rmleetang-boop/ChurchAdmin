import { describe, expect, it } from "vitest";
import { calculateGrowthPercent, formatNaira } from "../shared/churchflowMetrics";

describe("churchflow metrics", () => {
  it("calculates a rounded growth percentage", () => {
    expect(calculateGrowthPercent(864, 813)).toBe(6.3);
    expect(calculateGrowthPercent(100, 0)).toBe(100);
    expect(calculateGrowthPercent(0, 0)).toBe(0);
  });

  it("formats contribution amounts for the Nigerian locale", () => {
    expect(formatNaira(6840000)).toContain("6,840,000");
    expect(formatNaira(75000)).toContain("75,000");
  });
});
