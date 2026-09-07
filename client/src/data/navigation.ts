import { LayoutDashboard, UsersRound, ClipboardCheck, WalletCards, FolderKanban, CalendarDays, MessageSquareText, Mic, Users, Handshake, HeartHandshake } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Overview", title: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "People", title: "People", path: "/people", icon: UsersRound },
  { label: "Attendance", title: "Attendance", path: "/attendance", icon: ClipboardCheck },
  { label: "Giving", title: "Giving", path: "/giving", icon: WalletCards },
  { label: "Projects", title: "Projects & goals", path: "/projects", icon: FolderKanban },
  { label: "Events", title: "Events", path: "/events", icon: CalendarDays },
  { label: "Communications", title: "Communications", path: "/communications", icon: MessageSquareText },
  { label: "Sermons", title: "Sermons", path: "/sermons", icon: Mic },
  { label: "Departments", title: "Departments", path: "/departments", icon: Users },
  { label: "Volunteers", title: "Volunteers", path: "/volunteers", icon: Handshake },
  { label: "Care inbox", title: "Care inbox", path: "/care", icon: HeartHandshake },
] as const;
export type Section = typeof NAV_ITEMS[number]["label"];
export const PASTOR_NAME = "Pastor Domique Somwe";
export const CHURCH_NAME = "Heirs of Promise Sanctuary";