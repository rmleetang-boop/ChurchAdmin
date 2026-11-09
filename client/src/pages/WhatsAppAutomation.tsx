import { useEffect, useState } from "react";
import { BellRing, Check, Clock3, MessageCircle, Save, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

function PageFrame({ children }: { children: React.ReactNode }) {
  return <section className="module-view"><div className="module-header"><div><div className="eyebrow">MEMBER CARE · WHATSAPP</div><h1>WhatsApp automation</h1><p>Set up helpful replies and timely reminders for your church family. Settings save in this browser; connect the WhatsApp Business provider to activate live sending.</p></div></div>{children}</section>;
}

type AutomationSettings = {
  connected: boolean;
  welcomeEnabled: boolean;
  serviceReplyEnabled: boolean;
  prayerReplyEnabled: boolean;
  sundayReminderEnabled: boolean;
  volunteerReminderEnabled: boolean;
  reminderHours: number;
  welcomeReply: string;
  serviceReply: string;
  prayerReply: string;
};

const defaults: AutomationSettings = {
  connected: false,
  welcomeEnabled: true,
  serviceReplyEnabled: true,
  prayerReplyEnabled: true,
  sundayReminderEnabled: true,
  volunteerReminderEnabled: false,
  reminderHours: 24,
  welcomeReply: "Welcome to God's House of Prayer (GHOP)! We are glad you reached out. A member of our team will be in touch soon.",
  serviceReply: "Thank you for messaging GHOP. Our Sunday worship service begins at 10:00 AM. We look forward to welcoming you.",
  prayerReply: "We have received your prayer request. Our prayer team will keep it confidential and lift it up with care.",
};

function loadSettings(): AutomationSettings {
  try {
    const saved = localStorage.getItem("ghop-whatsapp-automation-v1");
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
}

export default function WhatsAppAutomation() {
  const [settings, setSettings] = useState<AutomationSettings>(loadSettings);
  useEffect(() => {
    localStorage.setItem("ghop-whatsapp-automation-v1", JSON.stringify(settings));
  }, [settings]);

  const update = <K extends keyof AutomationSettings>(key: K, value: AutomationSettings[K]) =>
    setSettings(current => ({ ...current, [key]: value }));
  const testMessage = () => {
    const preview = settings.welcomeReply;
    window.open(`https://wa.me/?text=${encodeURIComponent(preview)}`, "_blank", "noopener,noreferrer");
  };

  return <PageFrame>
    <div className="wa-status-banner" data-testid="whatsapp-provider-status">
      <div className="wa-status-icon"><MessageCircle size={22} /></div>
      <div className="wa-status-copy"><strong>{settings.connected ? "Provider connection configured" : "WhatsApp Business connection needed"}</strong><span>{settings.connected ? "Live automation is ready to be enabled after credentials are verified." : "These rules are saved locally for now. No messages are sent until the provider credentials and webhook are configured."}</span></div>
      <span className={`wa-connection-pill ${settings.connected ? "connected" : "pending"}`}><i />{settings.connected ? "Connected" : "Setup pending"}</span>
    </div>

    <div className="wa-safety-note"><ShieldCheck size={17} /><span>Only message people who have opted in to WhatsApp. Use approved WhatsApp templates for business-initiated reminders and honor STOP/opt-out requests.</span></div>

    <div className="wa-automation-grid">
      <section className="panel wa-panel">
        <div className="panel-heading"><div><div className="eyebrow">INBOUND MESSAGES</div><h2>Automatic replies</h2></div><Sparkles size={19} className="wa-accent-icon" /></div>
        <p className="wa-panel-intro">Choose the first response members receive when they contact GHOP.</p>
        <label className="wa-rule"><span><strong>Welcome new conversations</strong><small>Reply to a first-time message with a warm welcome.</small></span><input aria-label="Enable welcome reply" type="checkbox" checked={settings.welcomeEnabled} onChange={event => update("welcomeEnabled", event.target.checked)} /></label>
        {settings.welcomeEnabled && <label className="wa-field">Welcome reply<textarea value={settings.welcomeReply} onChange={event => update("welcomeReply", event.target.value)} rows={3} /></label>}
        <label className="wa-rule"><span><strong>Service information</strong><small>Answer common questions about worship times.</small></span><input aria-label="Enable service information reply" type="checkbox" checked={settings.serviceReplyEnabled} onChange={event => update("serviceReplyEnabled", event.target.checked)} /></label>
        {settings.serviceReplyEnabled && <label className="wa-field">Service reply<textarea value={settings.serviceReply} onChange={event => update("serviceReply", event.target.value)} rows={3} /></label>}
        <label className="wa-rule"><span><strong>Prayer request acknowledgement</strong><small>Confirm receipt without exposing private requests.</small></span><input aria-label="Enable prayer reply" type="checkbox" checked={settings.prayerReplyEnabled} onChange={event => update("prayerReplyEnabled", event.target.checked)} /></label>
        {settings.prayerReplyEnabled && <label className="wa-field">Prayer reply<textarea value={settings.prayerReply} onChange={event => update("prayerReply", event.target.value)} rows={3} /></label>}
      </section>

      <section className="panel wa-panel">
        <div className="panel-heading"><div><div className="eyebrow">SCHEDULED FOLLOW-UP</div><h2>Reminder automations</h2></div><BellRing size={19} className="wa-accent-icon" /></div>
        <p className="wa-panel-intro">Configure reminders that can be sent through an approved WhatsApp Business integration.</p>
        <label className="wa-rule"><span><strong>Sunday service reminder</strong><small>Remind opted-in members before the weekly service.</small></span><input aria-label="Enable Sunday service reminder" type="checkbox" checked={settings.sundayReminderEnabled} onChange={event => update("sundayReminderEnabled", event.target.checked)} /></label>
        <label className="wa-rule"><span><strong>Volunteer confirmation reminder</strong><small>Nudge volunteers who have not confirmed their roster.</small></span><input aria-label="Enable volunteer reminder" type="checkbox" checked={settings.volunteerReminderEnabled} onChange={event => update("volunteerReminderEnabled", event.target.checked)} /></label>
        <label className="wa-field wa-time-field"><span>Send reminders before the event</span><span className="wa-time-control"><Clock3 size={15} /><select value={settings.reminderHours} onChange={event => update("reminderHours", Number(event.target.value))}><option value={2}>2 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option></select></span></label>
        <div className="wa-next-step"><strong>Provider setup required</strong><p>When ready, add your WhatsApp Business phone number ID, access token, and webhook verification details through the deployment's protected secrets configuration. Never paste API tokens into this screen.</p></div>
        <div className="wa-saved"><Check size={14} />Settings save automatically on this device</div>
      </section>
    </div>
    <div className="wa-footer-actions"><span>Ready for WhatsApp Cloud API or an approved Business Solution Provider.</span><button className="button button-primary" onClick={() => toast.success("Automation settings saved", { description: "The rules are stored locally. Live messaging awaits WhatsApp Business credentials." })}><Save size={15} />Save settings</button></div>
  </PageFrame>;
}
