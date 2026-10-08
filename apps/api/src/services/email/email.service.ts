import {
  type OrderConfirmationData,
  defaultBrand,
  renderOrderConfirmation,
} from "./order-confirmation.template";

/**
 * Sends transactional email through the Resend HTTP API.
 * Required env: RESEND_API_KEY, EMAIL_FROM (e.g. "Noklity <orders@noklity.com>").
 * The sending domain must be verified in Resend.
 */
export class EmailService {
  static async send(params: { to: string; subject: string; html: string; text: string }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not provided. Email to", params.to, "was not sent.");
      return false;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${defaultBrand.name} <orders@noklity.com>`,
        to: [params.to],
        reply_to: defaultBrand.supportEmail,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      console.error("Failed to send email:", res.status, await res.text());
      return false;
    }
    return true;
  }

  static async sendOrderConfirmation(to: string, data: OrderConfirmationData) {
    return EmailService.send({ to, ...renderOrderConfirmation(data) });
  }
}
