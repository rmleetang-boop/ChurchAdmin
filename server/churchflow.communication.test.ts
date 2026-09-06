import { describe, expect, it } from "vitest";
import { buildEmailReminderLink, buildWhatsAppReminderLink } from "../shared/communicationLinks";

describe("churchflow communication links", () => {
  it("builds a prefilled WhatsApp reminder link", () => {
    const link = buildWhatsAppReminderLink("+234 801 234 5678", "Will you join us Sunday? https://paystack.com/pay/chairs");
    expect(link).toContain("https://wa.me/2348012345678");
    expect(link).toContain("paystack.com%2Fpay%2Fchairs");
  });

  it("builds a prefilled email reminder link", () => {
    const link = buildEmailReminderLink("member@example.com", "Sunday service", "Please declare attendance.");
    expect(link).toContain("mailto:member%40example.com");
    expect(link).toContain("subject=Sunday%20service");
  });
});
