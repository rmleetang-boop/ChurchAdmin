export default function Avatar({ initials, tone = "indigo", small = false, large = false }: { initials: string; tone?: string; small?: boolean; large?: boolean }) {
  return <span className={`avatar avatar-${tone} ${small ? "avatar-small" : ""} ${large ? "avatar-large" : ""}`}>{initials}</span>;
}
