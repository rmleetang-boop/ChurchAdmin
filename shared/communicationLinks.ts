export function buildWhatsAppReminderLink(phone: string, message: string): string {
  const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildEmailReminderLink(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
