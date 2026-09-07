export type MemberStatus = "Active" | "Visitor" | "Inactive" | "Needs follow-up";
export type AgeGroup = "Children" | "Youth" | "Young adults" | "Adults" | "Seniors";
export type Gender = "Female" | "Male";

export type Giving = { fund: string; amount: number; date: string };

export type Member = {
  id: number;
  name: string;
  initials: string;
  tone: string;
  branch: string;
  status: MemberStatus;
  department: string;
  ageGroup: AgeGroup;
  gender: Gender;
  joined: string;
  lastAttendance: string;
  tags: string[];
  birthday: string;
  anniversary?: string;
  phone: string;
  email: string;
  giving: Giving[];
  attendance: boolean[];
  notes: string;
};

export const BRANCHES = ["Milnerton", "Bellville", "Eastgate", "Kinshasa", "Lubumbashi"] as const;
export const DEPARTMENTS = ["Worship & Creative", "Children's Church", "Welcome & Hospitality", "Media & Production", "Intercessors", "Ushering", "Youth Ministry", "Outreach"] as const;
export const STATUSES: MemberStatus[] = ["Active", "Visitor", "Inactive", "Needs follow-up"];
export const AGE_GROUPS: AgeGroup[] = ["Children", "Youth", "Young adults", "Adults", "Seniors"];
export const GENDERS: Gender[] = ["Female", "Male"];
export const TAGS = ["Baptised", "Leader", "Volunteer", "New believer", "Small group", "Tither", "Married", "Student"] as const;
export const FUNDS = ["Tithe", "Offering", "Building project", "Missions", "Benevolence"] as const;

const CONGO_F = ["Chantal", "Nadine", "Grâce", "Mireille", "Ornella", "Divine", "Bijou", "Esther", "Joyce", "Merveille", "Ruth", "Patricia"];
const CONGO_M = ["Jean-Pierre", "Serge", "Parfait", "Emmanuel", "Patrick", "Josué", "Jean-Claude", "David", "Christian", "Moïse", "Joseph", "Trésor"];
const CONGO_LAST = ["Kasongo", "Ilunga", "Mutombo", "Mbuyi", "Mukendi", "Kabeya", "Tshibangu", "Mwamba", "Kalala", "Kolesha", "Somwe", "Kabongo"];
const SA_F = ["Naledi", "Thandiwe", "Lerato", "Zanele", "Nomsa", "Lindiwe", "Refilwe", "Tshepiso", "Nokuthula", "Bontle", "Palesa", "Ayanda"];
const SA_M = ["Thabo", "Sipho", "Kabelo", "Bongani", "Andile", "Sizwe", "Lungelo", "Mandla", "Themba", "Sibusiso", "Luyanda", "Tumelo"];
const SA_LAST = ["Mokoena", "Dlamini", "Ndlovu", "Molefe", "Nkosi", "Van Wyk", "Mbeki", "Tshabalala", "Zulu", "Mahlangu", "Sithole", "Khumalo"];
const TONES = ["rose", "indigo", "amber", "emerald", "violet", "slate", "gold"];

let seed = 7;
const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d; };

export const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function buildMember(i: number): Member {
  const gender: Gender = rand() > 0.52 ? "Female" : "Male";
  const congolese = i % 2 === 0;
  const first = gender === "Female" ? pick(congolese ? CONGO_F : SA_F) : pick(congolese ? CONGO_M : SA_M);
  const last = pick(congolese ? CONGO_LAST : SA_LAST);
  const status: MemberStatus = i % 9 === 0 ? "Visitor" : i % 11 === 0 ? "Inactive" : i % 7 === 0 ? "Needs follow-up" : "Active";
  const attendance = Array.from({ length: 12 }, (_, w) => {
    if (status === "Inactive") return w < 3 && rand() > 0.6;
    if (status === "Needs follow-up") return w < 8 ? rand() > 0.3 : false;
    if (status === "Visitor") return w >= 10;
    return rand() > 0.22;
  });
  const lastPresent = attendance.lastIndexOf(true);
  const lastAttendance = lastPresent === -1 ? iso(daysAgo(120)) : iso(daysAgo((11 - lastPresent) * 7));
  const joined = status === "Visitor" ? daysAgo(Math.floor(rand() * 21)) : daysAgo(60 + Math.floor(rand() * 2400));
  const tags = TAGS.filter(() => rand() > 0.62).slice(0, 3);
  if (status === "Visitor") tags.splice(0, tags.length, "New believer");
  const bday = new Date(TODAY); bday.setDate(bday.getDate() + ((i * 5) % 40) - 8);
  const anniv = rand() > 0.7 ? (() => { const d = new Date(TODAY); d.setDate(d.getDate() + ((i * 3) % 30) - 5); return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })() : undefined;
  const givingCount = status === "Active" ? 2 + Math.floor(rand() * 5) : status === "Visitor" ? 0 : 1;
  const giving: Giving[] = Array.from({ length: givingCount }, (_, g) => ({ fund: pick(FUNDS), amount: [250, 500, 1200, 2500, 5000, 8500, 12000][Math.floor(rand() * 7)], date: iso(daysAgo(g * 14 + Math.floor(rand() * 10))) }));
  const ageGroup = pick(AGE_GROUPS);
  return {
    id: i + 1,
    name: `${first} ${last}`,
    initials: `${first[0]}${last[0]}`,
    tone: pick(TONES),
    branch: pick(BRANCHES),
    status,
    department: pick(DEPARTMENTS),
    ageGroup,
    gender,
    joined: iso(joined),
    lastAttendance,
    tags,
    birthday: `${String(bday.getMonth() + 1).padStart(2, "0")}-${String(bday.getDate()).padStart(2, "0")}`,
    anniversary: anniv,
    phone: `+27 ${60 + Math.floor(rand() * 30)} ${String(100 + Math.floor(rand() * 900))} ${String(1000 + Math.floor(rand() * 9000))}`,
    email: `${first.toLowerCase().replace(/[^a-z]/g, "")}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
    giving: giving.sort((a, b) => b.date.localeCompare(a.date)),
    attendance,
    notes: status === "Needs follow-up" ? "Has missed several Sundays. Last spoke with the care team about a family transition." : status === "Visitor" ? "First-time guest. Interested in the New Members class." : status === "Inactive" ? "Relocated in the last quarter. Confirm whether to transfer membership." : "Serving faithfully. Consider for small-group leadership.",
  };
}

export const MEMBERS: Member[] = Array.from({ length: 56 }, (_, i) => buildMember(i));

export const currentStreak = (attendance: boolean[]) => { let s = 0; for (let i = attendance.length - 1; i >= 0 && attendance[i]; i--) s++; return s; };
export const consecutiveMisses = (attendance: boolean[]) => { let s = 0; for (let i = attendance.length - 1; i >= 0 && !attendance[i]; i--) s++; return s; };

export const zar = (n: number) => `R${n.toLocaleString("en-ZA")}`;
export const compactZar = (n: number) => n >= 1_000_000 ? `R${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `R${Math.round(n / 1000)}K` : `R${n}`;

export const FUND_TRENDS: Record<string, number[]> = {
  Tithe: [2.92, 3.08, 3.21, 3.34, 3.52, 3.76],
  Offering: [1.84, 1.91, 2.05, 1.98, 2.12, 2.24],
  "Building project": [0.32, 0.41, 0.48, 0.55, 0.62, 0.84],
  Missions: [0.18, 0.2, 0.19, 0.24, 0.26, 0.31],
  Benevolence: [0.09, 0.11, 0.1, 0.13, 0.12, 0.14],
};
export const TREND_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const PLEDGES = [
  { id: 1, name: "Building project 2026", pledged: 4_800_000, received: 3_210_000, donors: 142, due: "Dec 2026" },
  { id: 2, name: "Kinshasa church plant", pledged: 1_500_000, received: 640_000, donors: 61, due: "Sep 2026" },
  { id: 3, name: "Children's hall refresh", pledged: 900_000, received: 812_000, donors: 88, due: "Aug 2026" },
];

export const SERVING_TEAMS = [
  { name: "Worship", color: "#c9a961", roles: ["Lead", "Keys", "Drums", "Vocals"] },
  { name: "Ushering", color: "#7fb69a", roles: ["Door", "Seating", "Offering"] },
  { name: "Media", color: "#7ea6c9", roles: ["Sound", "Livestream", "Slides"] },
  { name: "Kids", color: "#d9a35a", roles: ["Teacher", "Helper", "Check-in"] },
  { name: "Hospitality", color: "#d07a72", roles: ["Coffee", "Welcome desk"] },
];

export const nextSundays = (count: number) => {
  const out: Date[] = [];
  const d = new Date(TODAY);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  for (let i = 0; i < count; i++) { out.push(new Date(d)); d.setDate(d.getDate() + 7); }
  return out;
};

export const EVENTS = [
  { day: "14", month: "JUN", title: "Leadership Summit", time: "Sat · 9:00 AM", type: "Leadership", color: "violet" },
  { day: "18", month: "JUN", title: "Midweek Worship", time: "Wed · 6:30 PM", type: "Worship", color: "blue" },
  { day: "21", month: "JUN", title: "Community Outreach", time: "Sat · 10:00 AM", type: "Outreach", color: "amber" },
  { day: "28", month: "JUN", title: "New Members Class", time: "Sat · 2:00 PM", type: "Growth", color: "green" },
];

export const fmtDate = (d: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(d).toLocaleDateString("en-ZA", opts);
