import { BRANCHES } from "@/data/demo";
import { FEATURE_STATUS_LABELS, type DepartmentWorkspace } from "@shared/departmentFeatures";

export function exportDepartmentBrief(items: DepartmentWorkspace[], isSample: boolean) {
  const content = ["# Department feature briefs", "Heirs of Promise Sanctuary", `Exported: ${new Date().toISOString().slice(0, 10)}`,
    isSample ? "Sample workspace — share this file with your development team. This has not been sent automatically." : "Share this brief with the development team. Requests describe desired functionality, not automatically generated features.",
    ...items.map(dept => [
      `\n## ${dept.name}`, `Branch: ${BRANCHES[dept.branchId - 1]}`, `Leader: ${dept.leadName}`, `Purpose: ${dept.description || "Not specified"}`,
      ...(dept.features.length ? dept.features.map((feature, i) => `\n### ${i + 1}. ${feature.title}\nPriority: ${feature.priority}\nStatus: ${FEATURE_STATUS_LABELS[feature.status]}\nRequested: ${feature.createdAt}\n\n${feature.description}\n\nTeam notes: ${feature.teamNotes || "None yet"}`) : ["No feature requests yet."]),
    ].join("\n")),
  ].join("\n\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "department-feature-briefs.md";
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}