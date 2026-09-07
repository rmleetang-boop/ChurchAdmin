import { Cake, Gem, Send } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import { MEMBERS, TODAY } from "@/data/demo";

type Occasion = { id: string; name: string; initials: string; tone: string; kind: "Birthday" | "Anniversary"; inDays: number };

const dayLabel = (n: number) => n === 0 ? "Today" : n === 1 ? "Tomorrow" : (() => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-ZA", { weekday: "short" }); })();

function daysUntil(mmdd: string) {
  const [m, d] = mmdd.split("-").map(Number);
  const target = new Date(TODAY.getFullYear(), m - 1, d);
  if (target < TODAY) target.setFullYear(target.getFullYear() + 1);
  return Math.round((target.getTime() - TODAY.getTime()) / 86400000);
}

export function upcomingOccasions(): Occasion[] {
  const out: Occasion[] = [];
  MEMBERS.forEach(m => {
    const b = daysUntil(m.birthday); if (b <= 6) out.push({ id: `b-${m.id}`, name: m.name, initials: m.initials, tone: m.tone, kind: "Birthday", inDays: b });
    if (m.anniversary) { const a = daysUntil(m.anniversary); if (a <= 6) out.push({ id: `a-${m.id}`, name: m.name, initials: m.initials, tone: m.tone, kind: "Anniversary", inDays: a }); }
  });
  return out.sort((x, y) => x.inDays - y.inDays);
}

export default function BirthdaysWidget() {
  const items = upcomingOccasions();
  return <div className="panel celebrate-panel" data-testid="birthdays-widget">
    <div className="panel-heading"><div><div className="eyebrow">THIS WEEK</div><h2>Celebrations <span className="count-pill">{items.length}</span></h2></div><Cake size={18} className="gold-text" /></div>
    <div className="celebrate-list">
      {items.length === 0 && <p className="drawer-copy">No birthdays or anniversaries this week.</p>}
      {items.slice(0, 6).map(o => <div className="celebrate-row" key={o.id}>
        <Avatar initials={o.initials} tone={o.tone} small />
        <div className="person-info"><strong>{o.name}</strong><span>{o.kind === "Birthday" ? <Cake size={11} /> : <Gem size={11} />}{o.kind} · {dayLabel(o.inDays)}</span></div>
        <button className="row-action" data-testid={`greet-${o.id}`} onClick={() => toast.success("Greeting sent", { description: `Happy ${o.kind.toLowerCase()} wishes sent to ${o.name} via WhatsApp.` })}><Send size={12} />Greet</button>
      </div>)}
    </div>
    {items.length > 6 && <p className="drawer-copy">+{items.length - 6} more this week</p>}
  </div>;
}
