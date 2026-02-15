/**
 * Centralized email sending via Resend.
 * Returns { ok, error? } so callers can surface failures (e.g. invalid API key, unverified domain).
 *
 * Resend: verify a domain at resend.com/domains and set:
 *   RESEND_FROM_ADDRESS="LoanFlow <notifications@yourdomain.com>"
 *
 * Deliverability: set EMAIL_APP_URL to your public app URL (e.g. https://yourdomain.com) so links
 * in emails are never localhost — localhost links are a major spam trigger.
 */

function getFromAddress(): string {
  const custom = process.env.RESEND_FROM_ADDRESS?.trim();
  if (custom) return custom;
  return "onboarding@resend.dev";
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text version; improves deliverability and reduces spam scoring. */
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
  if (!to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] No RESEND_API_KEY — would have sent:", { to, subject });
    return { ok: false, error: "Email is not configured. Add RESEND_API_KEY to your environment." };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to.trim()],
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: string }).message)
          : "Unknown error";
      console.error("[Email] Resend error:", error);
      return { ok: false, error: message };
    }

    if (!data?.id) {
      return { ok: false, error: "No confirmation from email service" };
    }

    console.log("[Email] Sent successfully:", data.id, "to", to.trim());
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Email] Exception:", err);
    return { ok: false, error: message };
  }
}
