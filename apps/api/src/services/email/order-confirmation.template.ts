export interface OrderItem {
  name: string;
  quantity: number;
  /** Unit price in whole currency units, e.g. 1250 */
  price: number;
}

export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: Date;
  items: OrderItem[];
  shippingFee?: number;
  discount?: number;
  currency?: string;
  paymentMethod?: string;
  shippingAddress?: string;
  orderUrl?: string;
}

export interface BrandConfig {
  name: string;
  siteUrl: string;
  /** Must be an absolute, publicly reachable URL (PNG/JPG; SVG is blocked by Gmail). */
  logoUrl: string;
  supportEmail: string;
  primaryColor: string;
}

export const defaultBrand: BrandConfig = {
  name: "Noklity",
  siteUrl: process.env.SITE_URL || "https://noklity.com",
  logoUrl: process.env.EMAIL_LOGO_URL || "https://noklity.com/email-logo.png",
  supportEmail: process.env.SUPPORT_EMAIL || "noklitybd@gmail.com",
  primaryColor: "#0f172a",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function renderOrderConfirmation(
  data: OrderConfirmationData,
  brand: BrandConfig = defaultBrand,
): { subject: string; html: string; text: string } {
  const currency = data.currency ?? "BDT";
  const shippingFee = data.shippingFee ?? 0;
  const discount = data.discount ?? 0;
  const subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + shippingFee - discount;
  const orderUrl = data.orderUrl ?? `${brand.siteUrl}/orders/${encodeURIComponent(data.orderNumber)}`;
  const dateText = data.orderDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const name = escapeHtml(data.customerName);
  const orderNo = escapeHtml(data.orderNumber);
  const subject = `Order confirmed – #${data.orderNumber} | ${brand.name}`;
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const itemRows = data.items
    .map(
      (i) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">
            ${escapeHtml(i.name)}
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Qty: ${i.quantity}</div>
          </td>
          <td align="right" style="padding:14px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;white-space:nowrap;">
            ${money(i.price * i.quantity, currency)}
          </td>
        </tr>`,
    )
    .join("");

  const summaryRow = (label: string, value: string, strong = false) => `
        <tr>
          <td style="padding:6px 0;font-size:${strong ? 16 : 14}px;color:${strong ? "#111827" : "#4b5563"};font-weight:${strong ? 700 : 400};">${label}</td>
          <td align="right" style="padding:6px 0;font-size:${strong ? 16 : 14}px;color:#111827;font-weight:${strong ? 700 : 400};">${value}</td>
        </tr>`;

  const detailBlock = (label: string, value?: string) =>
    value
      ? `<td valign="top" style="padding:0 12px 0 0;font-size:13px;color:#374151;line-height:1.6;">
           <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">${label}</div>
           ${escapeHtml(value).replace(/\n/g, "<br />")}
         </td>`
      : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:${font};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Thank you, ${name}! Your order #${orderNo} has been received.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:${brand.primaryColor};padding:28px 24px;">
              <a href="${brand.siteUrl}" style="text-decoration:none;">
                <img src="${brand.logoUrl}" alt="${escapeHtml(brand.name)}" height="44" style="display:block;height:44px;border:0;margin:0 auto;color:#ffffff;font-size:22px;font-weight:700;" />
              </a>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 36px 8px 36px;">
              <h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.3;color:#111827;">Thank you for your order, ${name}!</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">
                We have received your order and it is now being processed. We will notify you again as soon as it ships.
              </p>
            </td>
          </tr>

          <!-- Order number -->
          <tr>
            <td style="padding:20px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">Order number</div>
                    <div style="font-size:22px;font-weight:700;color:${brand.primaryColor};letter-spacing:.02em;margin-top:2px;">#${orderNo}</div>
                  </td>
                  <td align="right" style="padding:18px 20px;">
                    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">Order date</div>
                    <div style="font-size:14px;color:#111827;margin-top:4px;">${dateText}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:8px 36px 0 36px;">
              <h2 style="margin:0 0 4px 0;font-size:16px;color:#111827;">Order summary</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                ${summaryRow("Subtotal", money(subtotal, currency))}
                ${shippingFee ? summaryRow("Shipping", money(shippingFee, currency)) : ""}
                ${discount ? summaryRow("Discount", `– ${money(discount, currency)}`) : ""}
                <tr><td colspan="2" style="border-top:2px solid #111827;height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
                ${summaryRow("Total", money(total, currency), true)}
              </table>
            </td>
          </tr>

          <!-- Delivery / payment -->
          ${
            data.shippingAddress || data.paymentMethod
              ? `<tr>
            <td style="padding:24px 36px 0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                ${detailBlock("Delivery address", data.shippingAddress)}
                ${detailBlock("Payment method", data.paymentMethod)}
              </tr></table>
            </td>
          </tr>`
              : ""
          }

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:32px 36px 12px 36px;">
              <a href="${orderUrl}" style="display:inline-block;background:${brand.primaryColor};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;">View your order</a>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding:12px 36px 36px 36px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">
                Questions about your order? Reply to this email or contact us at
                <a href="mailto:${brand.supportEmail}" style="color:${brand.primaryColor};font-weight:600;">${brand.supportEmail}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">&copy; ${new Date().getFullYear()} ${escapeHtml(brand.name)}. All rights reserved.</p>
              <p style="margin:0;font-size:12px;"><a href="${brand.siteUrl}" style="color:#6b7280;">${brand.siteUrl.replace(/^https?:\/\//, "")}</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${data.customerName},`,
    "",
    `Thank you for your order! Your order number is #${data.orderNumber} (${dateText}).`,
    "",
    ...data.items.map((i) => `- ${i.name} x${i.quantity}: ${money(i.price * i.quantity, currency)}`),
    "",
    `Subtotal: ${money(subtotal, currency)}`,
    shippingFee ? `Shipping: ${money(shippingFee, currency)}` : "",
    discount ? `Discount: -${money(discount, currency)}` : "",
    `Total: ${money(total, currency)}`,
    "",
    data.shippingAddress ? `Delivery address:\n${data.shippingAddress}\n` : "",
    `View your order: ${orderUrl}`,
    "",
    `Need help? ${brand.supportEmail}`,
    `${brand.name} – ${brand.siteUrl}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, html, text };
}
