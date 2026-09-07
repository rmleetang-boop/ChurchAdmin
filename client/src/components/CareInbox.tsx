import { useState } from "react";
import { EyeOff, HeartHandshake, LockKeyhole, MessageSquareHeart, Reply, Send, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export type CareReply = { id: number; message: string; leaderName?: string | null; time: string };
export type CareItem = { id: number; kind: "Prayer request" | "Testimony"; title: string; person: string; body: string; status: string; private: boolean; anonymous: boolean; time: string; replies: CareReply[] };

const QUICK_REPLIES = [
  "We are standing with you in prayer this week. You are not alone.",
  "Thank you for trusting us with this. Our prayer team is lifting you up.",
  "May the peace of God guard your heart and mind. We are praying.",
];

const DEMO_ITEMS: CareItem[] = [
  { id: 1, kind: "Prayer request", title: "Family health", person: "Chantal Kasongo", body: "Please pray for my mother as she continues her treatment.", status: "New", private: true, anonymous: false, time: "Today · 8:46 AM", replies: [] },
  { id: 5, kind: "Prayer request", title: "Strength through a hard season", person: "Anonymous member", body: "I am struggling quietly and would value the prayers of the church without sharing my name.", status: "New", private: true, anonymous: true, time: "Today · 7:15 AM", replies: [] },
  { id: 2, kind: "Testimony", title: "God made a way", person: "Sipho Ndlovu", body: "After months of searching, I received a new job offer and I want to thank the church for praying with me.", status: "Review", private: false, anonymous: false, time: "Yesterday · 4:20 PM", replies: [] },
  { id: 3, kind: "Prayer request", title: "Wisdom for my family", person: "Grâce Mutombo", body: "Please keep my family in prayer as we make an important decision.", status: "Praying", private: true, anonymous: false, time: "Jun 29 · 7:10 PM", replies: [{ id: 1, message: "We prayed for your family at Tuesday's intercessors meeting. Trusting God for clear direction.", leaderName: "Pastor Domique Somwe", time: "Jun 30 · 9:02 AM" }] },
  { id: 4, kind: "Testimony", title: "A peaceful recovery", person: "Lerato Mokoena", body: "I am grateful for a healthy recovery and the support of my small group.", status: "Published", private: false, anonymous: false, time: "Jun 27 · 11:32 AM", replies: [] },
];

function ReplyComposer({ item, onSend, onCancel, pending }: { item: CareItem; onSend: (message: string) => void; onCancel: () => void; pending: boolean }) {
  const [message, setMessage] = useState("");
  return <div className="reply-composer" data-testid={`reply-composer-${item.id}`}>
    <div className="reply-composer-head"><div><div className="eyebrow">ENCOURAGING REPLY</div><strong>{item.anonymous ? "Reply without seeing who sent it" : `Reply to ${item.person}`}</strong></div><button className="icon-button" onClick={onCancel} data-testid={`reply-cancel-${item.id}`}><X size={16} /></button></div>
    {item.anonymous && <p className="reply-privacy"><LockKeyhole size={12} />Your message is delivered to the sender's notifications. Their identity stays hidden from you and the team.</p>}
    <div className="chip-row">{QUICK_REPLIES.map((q, i) => <button key={i} className="filter-chip" data-testid={`quick-reply-${item.id}-${i}`} onClick={() => setMessage(q)}>{q.slice(0, 42)}…</button>)}</div>
    <textarea className="notes-field" data-testid={`reply-input-${item.id}`} rows={3} placeholder="Write a short word of encouragement or a scripture…" value={message} onChange={e => setMessage(e.target.value)} />
    <div className="reply-composer-foot"><span>{message.length}/2000</span><button className="button button-primary" data-testid={`reply-send-${item.id}`} disabled={message.trim().length < 2 || pending} onClick={() => onSend(message.trim())}><Send size={14} />{pending ? "Sending…" : "Send reply"}</button></div>
  </div>;
}

export default function CareInbox() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const prayerQuery = trpc.admin.prayerRequests.useQuery(undefined, { enabled: isAdmin, retry: false });
  const testimonyQuery = trpc.admin.testimonies.useQuery(undefined, { enabled: isAdmin, retry: false });
  const replyMutation = trpc.admin.replyToPrayer.useMutation();
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<CareItem[]>(DEMO_ITEMS);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const fmt = (d: string | Date) => new Date(d).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const liveItems: CareItem[] = [
    ...(prayerQuery.data ?? []).map(item => ({ id: item.id, kind: "Prayer request" as const, title: item.title, person: item.isAnonymous ? "Anonymous member" : "Member", body: item.request, status: item.status === "new" ? "New" : item.status === "praying" ? "Praying" : item.status === "answered" ? "Answered" : "Archived", private: Boolean(item.isPrivate), anonymous: Boolean(item.isAnonymous), time: fmt(item.createdAt), replies: item.replies.map(r => ({ id: r.id, message: r.message, leaderName: r.leaderName, time: fmt(r.createdAt) })) })),
    ...(testimonyQuery.data ?? []).map(item => ({ id: 100000 + item.id, kind: "Testimony" as const, title: item.title, person: "Member", body: item.story, status: item.status === "submitted" ? "Review" : item.status === "published" ? "Published" : item.status, private: !item.permissionToShare, anonymous: false, time: fmt(item.createdAt), replies: [] })),
  ];
  const isLive = liveItems.length > 0;
  const visibleItems = isLive ? liveItems : items;
  const filtered = filter === "All" ? visibleItems : visibleItems.filter(item => item.kind === filter);

  const sendReply = (item: CareItem, message: string) => {
    const apply = () => { setItems(cur => cur.map(r => r.id === item.id ? { ...r, status: r.status === "New" ? "Praying" : r.status, replies: [...r.replies, { id: Date.now(), message, leaderName: user?.name ?? "Leader", time: "Just now" }] } : r)); setReplyingTo(null); toast.success("Reply sent", { description: item.anonymous ? "Delivered to the sender without revealing who they are." : `${item.person} will see it in their notifications.` }); };
    if (isLive) replyMutation.mutate({ id: item.id, message, markPraying: true }, { onSuccess: () => { prayerQuery.refetch(); apply(); }, onError: e => toast.error("Reply failed", { description: e.message }) });
    else apply();
  };
  const advance = (item: CareItem) => { setItems(cur => cur.map(r => r.id === item.id ? { ...r, status: item.kind === "Testimony" ? "Published" : "Praying" } : r)); toast.success(item.kind === "Testimony" ? "Testimony marked for sharing" : "Prayer request moved to praying", { description: item.person }); };

  return <>
    <div className="care-inbox-summary">
      <div><MessageSquareHeart size={17} /><span><strong>{visibleItems.filter(i => i.kind === "Prayer request" && i.status === "New").length}</strong> new prayer requests</span></div>
      <div><Reply size={17} /><span><strong>{visibleItems.filter(i => i.kind === "Prayer request" && i.replies.length === 0).length}</strong> awaiting a reply</span></div>
      <div><EyeOff size={17} /><span><strong>{visibleItems.filter(i => i.anonymous).length}</strong> anonymous requests</span></div>
    </div>
    <div className="care-inbox-toolbar"><div>{["All", "Prayer request", "Testimony"].map(f => <button key={f} className={filter === f ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(f)}>{f === "All" ? "All" : f === "Prayer request" ? "Prayer requests" : "Testimonies"}</button>)}</div><span>{filtered.length} records</span></div>
    <div className="care-inbox-list">
      {filtered.map(item => <article className="care-inbox-item" key={item.id} data-testid={`care-item-${item.id}`}>
        <div className={`care-inbox-kind ${item.kind === "Testimony" ? "testimony-kind" : "prayer-kind"}`}>{item.kind === "Testimony" ? <Sparkles size={16} /> : <MessageSquareHeart size={16} />}</div>
        <div className="care-inbox-body">
          <div className="care-inbox-title"><div><span className="eyebrow">{item.kind.toUpperCase()} · {item.time}</span><h3>{item.title}</h3></div><span className={`status-badge ${item.status === "Published" || item.status === "Answered" ? "status-green" : item.status === "New" ? "status-gold" : "status-gray"}`}>{item.status}</span></div>
          <p>{item.body}</p>
          {item.replies.length > 0 && <div className="reply-thread" data-testid={`reply-thread-${item.id}`}>{item.replies.map(r => <div className="reply-bubble" key={r.id}><HeartHandshake size={13} /><div><span>{r.leaderName || "Leader"} · {r.time}</span><p>{r.message}</p></div></div>)}</div>}
          {replyingTo === item.id && <ReplyComposer item={item} pending={replyMutation.isPending} onSend={m => sendReply(item, m)} onCancel={() => setReplyingTo(null)} />}
          <div className="care-inbox-footer">
            <span>{item.anonymous ? <span className="avatar avatar-small avatar-slate"><EyeOff size={12} /></span> : <Avatar initials={item.person.split(" ").map(p => p[0]).join("")} tone={item.kind === "Testimony" ? "amber" : "indigo"} small />}{item.person}{item.anonymous && <em className="anon-badge" data-testid={`anon-badge-${item.id}`}><EyeOff size={10} />Anonymous</em>}</span>
            <span>{item.anonymous ? <><LockKeyhole size={12} /> Identity hidden by request</> : item.private ? <><LockKeyhole size={12} /> Private care record</> : <><Users size={12} /> Permission requested</>}</span>
            {item.kind === "Prayer request" && replyingTo !== item.id && <button className="reply-button" data-testid={`reply-btn-${item.id}`} onClick={() => setReplyingTo(item.id)}><Reply size={12} />{item.replies.length ? "Reply again" : "Send encouragement"}</button>}
            <button onClick={() => advance(item)}>{item.kind === "Testimony" ? "Review testimony" : "Mark praying"}</button>
          </div>
        </div>
      </article>)}
    </div>
  </>;
}
