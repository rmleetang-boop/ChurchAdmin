import { useEffect, useState } from "react";
import { CalendarCheck, Flame, Mail, MessageSquareText, Phone, Save, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import { currentStreak, fmtDate, zar, type Member } from "@/data/demo";

export default function MemberDrawer({ member, onClose }: { member: Member; onClose: () => void }) {
  const [notes, setNotes] = useState(member.notes);
  useEffect(() => { setNotes(member.notes); }, [member]);
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const streak = currentStreak(member.attendance);
  const present = member.attendance.filter(Boolean).length;
  const total = member.giving.reduce((s, g) => s + g.amount, 0);

  return <div className="drawer-backdrop" onClick={onClose} data-testid="member-drawer-backdrop">
    <aside className="drawer" onClick={e => e.stopPropagation()} data-testid="member-drawer">
      <div className="drawer-head">
        <Avatar initials={member.initials} tone={member.tone} large />
        <div className="drawer-title"><div className="eyebrow">{member.branch.toUpperCase()} · {member.department.toUpperCase()}</div><h2 data-testid="member-drawer-name">{member.name}</h2><span className={`status-badge ${member.status === "Active" ? "status-green" : member.status === "Visitor" ? "status-blue" : member.status === "Inactive" ? "status-gray" : "status-gold"}`}>{member.status}</span></div>
        <button className="icon-button" onClick={onClose} data-testid="member-drawer-close"><X size={18} /></button>
      </div>

      <div className="drawer-actions">
        <button className="button button-primary" onClick={() => toast.success("Message composer opened", { description: member.name })}><MessageSquareText size={14} />Message</button>
        <a className="button button-ghost" href={`tel:${member.phone}`}><Phone size={14} />Call</a>
        <a className="button button-ghost" href={`mailto:${member.email}`}><Mail size={14} />Email</a>
      </div>

      <div className="drawer-grid">
        <div className="drawer-fact"><span>Phone</span><strong>{member.phone}</strong></div>
        <div className="drawer-fact"><span>Email</span><strong className="truncate">{member.email}</strong></div>
        <div className="drawer-fact"><span>Joined</span><strong>{fmtDate(member.joined, { day: "numeric", month: "short", year: "numeric" })}</strong></div>
        <div className="drawer-fact"><span>Profile</span><strong>{member.ageGroup} · {member.gender}</strong></div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-head"><div className="eyebrow">ATTENDANCE</div><span className="streak"><Flame size={13} />{streak} week streak</span></div>
        <div className="attendance-dots" aria-label="Last 12 Sundays">{member.attendance.map((p, i) => <i key={i} className={p ? "on" : ""} title={`Week ${i + 1}`} />)}</div>
        <p className="drawer-copy"><CalendarCheck size={13} />Present {present} of the last 12 Sundays · last seen {fmtDate(member.lastAttendance)}</p>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-head"><div className="eyebrow">GIVING HISTORY</div><strong className="gold-text">{zar(total)}</strong></div>
        {member.giving.length === 0 ? <p className="drawer-copy">No giving recorded yet.</p> : <div className="giving-list">{member.giving.map((g, i) => <div className="giving-line" key={i}><span>{g.fund}</span><em>{fmtDate(g.date)}</em><strong>{zar(g.amount)}</strong></div>)}</div>}
      </div>

      <div className="drawer-section">
        <div className="eyebrow">TAGS</div>
        <div className="tag-row wrap">{member.tags.length ? member.tags.map(t => <i key={t} className="tag">{t}</i>) : <span className="drawer-copy">No tags yet</span>}</div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-head"><div className="eyebrow">PASTORAL NOTES</div><button className="text-button" data-testid="member-notes-save" onClick={() => toast.success("Note saved", { description: member.name })}><Save size={13} />Save</button></div>
        <textarea className="notes-field" data-testid="member-notes-input" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
      </div>
    </aside>
  </div>;
}
