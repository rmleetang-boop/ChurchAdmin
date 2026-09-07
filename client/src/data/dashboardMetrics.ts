import { MEMBERS, PLEDGES, BRANCHES, consecutiveMisses } from "./demo";

const branchGoals = [
  { title: "Building project", pledged: 4_800_000, received: 3_210_000 },
  { title: "Children's hall refresh", pledged: 900_000, received: 812_000 },
  { title: "Community food bank", pledged: 1_200_000, received: 1_200_000 },
  { title: "Kinshasa church plant", pledged: 1_500_000, received: 640_000 },
  { title: "Ministry centre", pledged: 850_000, received: 459_000 },
];

export function getDashboardMetrics(scope: number | "global") {
  const members = MEMBERS.filter(member => scope === "global" || member.branch === BRANCHES[scope - 1]);
  const attendance = Array.from({ length: 12 }, (_, week) => members.filter(member => member.attendance[week]).length);
  const present = attendance[11];
  const attendanceRate = members.length ? Math.round(present / members.length * 100) : 0;
  const goal = scope === "global" ? {
    title: "Our shared giving goals", pledged: PLEDGES.reduce((sum, pledge) => sum + pledge.pledged, 0), received: PLEDGES.reduce((sum, pledge) => sum + pledge.received, 0),
  } : branchGoals[scope - 1];
  const goalProgress = Math.round(goal.received / goal.pledged * 100);
  const activeRate = members.length ? members.filter(member => member.status === "Active").length / members.length * 100 : 0;
  const score = Math.round(attendanceRate * 0.5 + activeRate * 0.3 + goalProgress * 0.2);
  const followups = members.filter(member => consecutiveMisses(member.attendance) >= 3).sort((a, b) => consecutiveMisses(b.attendance) - consecutiveMisses(a.attendance));
  const lastFour = attendance.slice(-4).reduce((a, b) => a + b, 0);
  const previousFour = attendance.slice(-8, -4).reduce((a, b) => a + b, 0);
  const change = previousFour ? Math.round((lastFour - previousFour) / previousFour * 1000) / 10 : 0;
  return { members, attendance, present, attendanceRate, goal, goalProgress, score, followups, change };
}