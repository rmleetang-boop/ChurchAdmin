import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CircleDollarSign, CornerDownLeft, LayoutGrid, Search, UserRound } from "lucide-react";
import { EVENTS, MEMBERS, fmtDate, zar } from "@/data/demo";

type Item = { id: string; kind: "Section" | "Person" | "Event" | "Giving"; title: string; subtitle: string; run: () => void };

export default function CommandPalette({ open, onClose, sections, onNavigate, onOpenMember }: { open: boolean; onClose: () => void; sections: string[]; onNavigate: (s: string) => void; onOpenMember: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQuery(""); setIndex(0); setTimeout(() => inputRef.current?.focus(), 10); } }, [open]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const has = (s: string) => !q || s.toLowerCase().includes(q);
    const sec: Item[] = sections.filter(has).map(s => ({ id: `s-${s}`, kind: "Section", title: s, subtitle: "Go to section", run: () => onNavigate(s) }));
    const people: Item[] = MEMBERS.filter(m => has(`${m.name} ${m.branch} ${m.department} ${m.email}`)).slice(0, q ? 6 : 3).map(m => ({ id: `p-${m.id}`, kind: "Person", title: m.name, subtitle: `${m.branch} · ${m.department} · ${m.status}`, run: () => onOpenMember(m.id) }));
    const events: Item[] = EVENTS.filter(e => has(`${e.title} ${e.type}`)).slice(0, 4).map(e => ({ id: `e-${e.title}`, kind: "Event", title: e.title, subtitle: `${e.day} ${e.month} · ${e.time}`, run: () => onNavigate("Events") }));
    const giving: Item[] = q ? MEMBERS.flatMap(m => m.giving.map(g => ({ m, g }))).filter(({ m, g }) => has(`${m.name} ${g.fund}`)).slice(0, 4).map(({ m, g }, i) => ({ id: `g-${m.id}-${i}`, kind: "Giving", title: `${zar(g.amount)} · ${g.fund}`, subtitle: `${m.name} · ${fmtDate(g.date)}`, run: () => onNavigate("Giving") })) : [];
    return [...sec, ...people, ...events, ...giving];
  }, [query, sections, onNavigate, onOpenMember]);

  useEffect(() => { setIndex(0); }, [query]);

  if (!open) return null;
  const select = (item: Item) => { item.run(); onClose(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex(i => Math.min(items.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIndex(i => Math.max(0, i - 1)); }
    if (e.key === "Enter" && items[index]) select(items[index]);
    if (e.key === "Escape") onClose();
  };
  const Icon = ({ kind }: { kind: Item["kind"] }) => kind === "Section" ? <LayoutGrid size={15} /> : kind === "Person" ? <UserRound size={15} /> : kind === "Event" ? <CalendarDays size={15} /> : <CircleDollarSign size={15} />;

  return <div className="palette-backdrop" onClick={onClose} data-testid="command-palette-backdrop">
    <div className="palette" onClick={e => e.stopPropagation()} onKeyDown={onKey} data-testid="command-palette">
      <div className="palette-input"><Search size={17} /><input ref={inputRef} data-testid="command-palette-input" placeholder="Search people, events, giving, or jump to a section…" value={query} onChange={e => setQuery(e.target.value)} /><kbd>esc</kbd></div>
      <div className="palette-list">
        {items.length === 0 && <div className="palette-empty">Nothing found for “{query}”</div>}
        {items.map((item, i) => <button key={item.id} data-testid={`palette-item-${item.id}`} className={`palette-item ${i === index ? "active" : ""}`} onMouseEnter={() => setIndex(i)} onClick={() => select(item)}><span className={`palette-icon kind-${item.kind.toLowerCase()}`}><Icon kind={item.kind} /></span><div><strong>{item.title}</strong><span>{item.subtitle}</span></div><em>{item.kind}</em>{i === index && <CornerDownLeft size={13} className="palette-enter" />}</button>)}
      </div>
      <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>⌘</kbd><kbd>K</kbd> toggle</span></div>
    </div>
  </div>;
}
