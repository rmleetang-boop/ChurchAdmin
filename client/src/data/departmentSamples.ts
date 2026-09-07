import type { DepartmentWorkspace } from "@shared/departmentFeatures";

export const DEPARTMENT_SAMPLES: DepartmentWorkspace[] = [
  { id: 1, name: "Worship & Creative", leadName: "Chantal Kasongo", branchId: 1, description: "Creating space for heartfelt worship through music and creative expression.", memberCount: 12, features: [
    { id: 101, title: "Weekly worship rota", description: "Plan the Sunday music team, assign instruments and let each volunteer confirm their availability.", priority: "high", status: "planned", teamNotes: "Include a mobile-friendly confirmation flow.", createdAt: "2026-09-01T08:00:00Z" },
  ] },
  { id: 2, name: "Children's Church", leadName: "Naledi Mokoena", branchId: 2, description: "Helping the next generation grow in faith, friendship and belonging.", memberCount: 8, features: [
    { id: 102, title: "Secure child check-in", description: "Record each child's arrival, allergies and approved guardian, with a matching collection code.", priority: "high", status: "in_review", teamNotes: "Review guardian permissions and privacy requirements first.", createdAt: "2026-09-02T08:00:00Z" },
  ] },
  { id: 3, name: "Welcome & Hospitality", leadName: "Thandiwe Dlamini", branchId: 3, description: "Making every person feel seen, welcomed and at home.", memberCount: 9, features: [] },
  { id: 4, name: "Media & Production", leadName: "Serge Ilunga", branchId: 4, description: "Supporting every gathering with thoughtful sound, visuals and livestreaming.", memberCount: 6, features: [
    { id: 103, title: "Equipment checkout", description: "Track which volunteer has borrowed each camera or microphone and when it should be returned.", priority: "medium", status: "submitted", teamNotes: "", createdAt: "2026-09-03T08:00:00Z" },
  ] },
  { id: 5, name: "Intercessors", leadName: "Grâce Mutombo", branchId: 5, description: "Standing with our church family in prayer and encouragement.", memberCount: 11, features: [] },
  { id: 6, name: "Community Outreach", leadName: "Thabo Ndlovu", branchId: 1, description: "Sharing practical care and lasting hope with our neighbours.", memberCount: 10, features: [] },
];