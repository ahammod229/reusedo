export interface OrderItem {
  name: string;
  quantity: number;
  /** Unit price in whole currency units, e.g. 1250 */
  price: number;
  /** e.g. "44 / Black" */
  variant?: string;
  /** Absolute, public URL (PNG/JPG). */
  imageUrl?: string;
}

export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: Date;
  items: OrderItem[];
  shippingFee?: number;
  discount?: number;
  currency?: string;
  /** e.g. "Cash on Delivery (COD)" */
  paymentMethod?: string;
  /** e.g. "Outside Dhaka" */
  shippingMethod?: string;
  shippingAddress?: string;
  billingAddress?: string;
  orderUrl?: string;
}

export interface BrandConfig {
  name: string;
  siteUrl: string;
  /**
   * Absolute, publicly reachable PNG/JPG (Gmail blocks SVG). Defaults to the file in
   * apps/web/public/email-logo.png once the web app is deployed. When empty, an "N" badge is shown.
   */
  logoUrl?: string;
  supportEmail: string;
  supportPhone?: string;
  supportHours?: string;
  /** Header accent, buttons, order number. */
  primaryColor: string;
  /** Small highlights (badge letter, divider). */
  accentColor: string;
  social?: { label: string; url: string }[];
}

export const defaultBrand: BrandConfig = {
  name: "Noklity",
  siteUrl: process.env.SITE_URL || "https://noklity.com",
  logoUrl: process.env.EMAIL_LOGO_URL || `${process.env.SITE_URL || "https://noklity.com"}/email-logo.png`,
  supportEmail: process.env.SUPPORT_EMAIL || "support@noklity.com",
  supportPhone: process.env.SUPPORT_PHONE || "+8801713812668",
  supportHours: process.env.SUPPORT_HOURS || undefined,
  primaryColor: process.env.BRAND_PRIMARY_COLOR || "#173e65",
  accentColor: process.env.BRAND_ACCENT_COLOR || "#bc1823",
  social: [],
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (amount: number, currency: string) =>
  `${currency === "BDT" ? "Tk" : currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

export function renderOrderConfirmation(
  data: OrderConfirmationData,
  brand: BrandConfig = defaultBrand,
): { subject: string; html: string; text: string } {
  const currency = data.currency ?? "BDT";
  const shippingFee = data.shippingFee ?? 0;
  const discount = data.discount ?? 0;
  const subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + shippingFee - discount;
  const orderUrl =
    data.orderUrl ?? `${brand.siteUrl}/orders/${encodeURIComponent(data.orderNumber)}`;
  const dateText = data.orderDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const name = escapeHtml(data.customerName);
  const orderNo = escapeHtml(data.orderNumber);
  const brandName = escapeHtml(brand.name);
  const subject = `Order ${data.orderNumber} confirmed – thank you for shopping with ${brand.name}`;

  const wordmark = `<td style="padding-left:12px;font-size:22px;font-weight:800;letter-spacing:.16em;color:${brand.primaryColor};font-family:${FONT};">${brandName.toUpperCase()}</td>`;
  const mark = brand.logoUrl
    ? `<td valign="middle"><img src="${brand.logoUrl}" alt="${brandName}" height="44" style="display:block;height:44px;width:auto;border:0;" /></td>`
    : `<td align="center" valign="middle" width="40" height="40" style="width:40px;height:40px;border-radius:20px;background:${brand.primaryColor};color:#ffffff;font-size:20px;font-weight:800;font-family:${FONT};">N</td>`;
  const logo = `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${mark}${wordmark}</tr></table>`;

  const itemRows = data.items
    .map((i, idx) => {
      const image = i.imageUrl
        ? `<td width="72" valign="middle" style="padding:14px 14px 14px 16px;"><img src="${i.imageUrl}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:10px;border:1px solid #e5e7eb;object-fit:cover;" /></td>`
        : `<td width="6" style="padding:0;"></td>`;
      const border = idx < data.items.length - 1 ? "border-bottom:1px solid #eef0f4;" : "";
      return `
        <tr>
          ${image}
          <td valign="middle" style="padding:14px 8px 14px ${i.imageUrl ? "0" : "14px"};${border}">
            <div style="font-size:15px;font-weight:600;line-height:1.4;color:#111827;">${escapeHtml(i.name)}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:3px;">${i.variant ? `${escapeHtml(i.variant)} &nbsp;&middot;&nbsp; ` : ""}Qty ${i.quantity}</div>
          </td>
          <td align="right" valign="middle" style="padding:14px 16px 14px 8px;${border}font-size:15px;font-weight:700;color:#111827;white-space:nowrap;">${money(i.price * i.quantity, currency)}</td>
        </tr>`;
    })
    .join("");

  const line = (label: string, value: string) => `
        <tr>
          <td style="padding:5px 0;font-size:14px;color:#6b7280;">${label}</td>
          <td align="right" style="padding:5px 0;font-size:14px;font-weight:600;color:#374151;">${value}</td>
        </tr>`;

  const card = (label: string, rows: { title?: string; value?: string }[]) => {
    const body = rows
      .filter((r) => r.value)
      .map(
        (r) =>
          `${r.title ? `<div style="font-size:12px;font-weight:600;color:#6b7280;margin-top:10px;">${r.title}</div>` : ""}<div style="font-size:14px;line-height:1.6;color:#1f2937;">${escapeHtml(r.value as string).replace(/\n/g, "<br />")}</div>`,
      )
      .join("");
    return body
      ? `<td class="stack" width="50%" valign="top" style="padding:0 6px 12px 0;">
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;">
             <tr><td style="padding:14px 16px;">
               <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${brand.primaryColor};"><span style="color:${brand.accentColor};">&#9632;</span>&nbsp; ${label}</div>
               <div style="height:6px;line-height:6px;font-size:0;">&nbsp;</div>${body}
             </td></tr>
           </table>
         </td>`
      : "";
  };

  const step = (n: number, label: string, active: boolean) => `
      <td align="center" width="25%" valign="top" style="padding:0 2px;">
        <div style="width:28px;height:28px;line-height:28px;border-radius:14px;margin:0 auto;font-size:13px;font-weight:700;text-align:center;${
          active ? `background:${brand.accentColor};color:#ffffff;` : "background:#e5e7eb;color:#9ca3af;"
        }">${active ? "&#10003;" : n}</div>
        <div style="font-size:11px;margin-top:6px;font-weight:${active ? 700 : 500};color:${active ? "#111827" : "#9ca3af"};">${label}</div>
      </td>`;

  const support = [
    brand.supportPhone
      ? `<strong style="color:#111827;">${escapeHtml(brand.supportPhone)}</strong>${
          brand.supportHours ? ` <span style="color:#6b7280;">&middot; ${escapeHtml(brand.supportHours)}</span>` : ""
        }`
      : "",
    `<a href="mailto:${brand.supportEmail}" style="color:${brand.primaryColor};text-decoration:none;font-weight:600;">${brand.supportEmail}</a>`,
  ]
    .filter(Boolean)
    .join("<br />");

  const social = (brand.social ?? [])
    .map(
      (s) =>
        `<a href="${s.url}" style="display:inline-block;margin:0 10px;font-size:13px;color:#6b7280;text-decoration:none;">${escapeHtml(s.label)}</a>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(subject)}</title>
  <style>
    @media (max-width:620px){
      .container{width:100%!important}
      .pad{padding-left:18px!important;padding-right:18px!important}
      .stack{display:block!important;width:100%!important;padding-right:0!important}
      .hero-title{font-size:24px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Order ${orderNo} is confirmed. We are getting it ready to ship.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

        <!-- Logo -->
        <tr><td align="center" style="padding:4px 0 20px 0;">
          <a href="${brand.siteUrl}" style="text-decoration:none;display:inline-block;">${logo}</a>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(23,62,101,.08);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

            <!-- Hero -->
            <tr><td class="pad" align="center" bgcolor="${brand.primaryColor}" style="background:${brand.primaryColor};background-image:linear-gradient(135deg,${brand.primaryColor} 0%,#0f2b47 100%);padding:40px 40px 36px 40px;">
              <div style="width:52px;height:52px;line-height:52px;border-radius:26px;background:#ffffff;color:${brand.accentColor};font-size:26px;font-weight:700;text-align:center;margin:0 auto 16px auto;">&#10003;</div>
              <h1 class="hero-title" style="margin:0 0 8px 0;font-size:28px;line-height:1.25;font-weight:700;color:#ffffff;">Order confirmed</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#cbd5e1;">Thank you, ${name}. We&rsquo;ve received your order and will let you know as soon as it ships.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
                <td style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:9px 20px;font-size:13px;color:#e2e8f0;letter-spacing:.04em;">
                  Order <strong style="color:#ffffff;font-size:15px;">#${orderNo}</strong> &nbsp;&middot;&nbsp; ${dateText}
                </td>
              </tr></table>
            </td></tr>

            <!-- Tracker -->
            <tr><td class="pad" style="padding:28px 40px 4px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                ${step(1, "Order placed", true)}${step(2, "Processing", false)}${step(3, "Shipped", false)}${step(4, "Delivered", false)}
              </tr></table>
            </td></tr>

            <!-- CTA -->
            <tr><td class="pad" align="center" style="padding:24px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td align="center" bgcolor="${brand.accentColor}" style="border-radius:10px;"><a href="${orderUrl}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">View order details</a></td>
              </tr></table>
              <div style="margin-top:12px;font-size:13px;"><a href="${brand.siteUrl}" style="color:${brand.primaryColor};text-decoration:none;font-weight:600;">Continue shopping &rarr;</a></div>
            </td></tr>

            <!-- Items -->
            <tr><td class="pad" style="padding:28px 40px 0 40px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${brand.primaryColor};margin-bottom:10px;">Your items</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;">${itemRows}</table>
            </td></tr>

            <!-- Totals -->
            <tr><td class="pad" style="padding:18px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:0 4px;">
                ${line("Subtotal", money(subtotal, currency))}
                ${line("Shipping", money(shippingFee, currency))}
                ${discount ? line("Discount", `&minus; ${money(discount, currency)}`) : ""}
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#f1f5f9;border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;font-weight:600;color:#374151;">Total amount</td>
                  <td align="right" style="padding:16px 18px;font-size:24px;font-weight:800;color:${brand.primaryColor};white-space:nowrap;">${money(total, currency)} <span style="font-size:12px;font-weight:600;color:#6b7280;">${escapeHtml(currency)}</span></td>
                </tr>
              </table>
            </td></tr>

            <!-- Info cards -->
            <tr><td class="pad" style="padding:28px 34px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                ${card("Shipping to", [{ value: data.shippingAddress }])}
                ${card("Payment &amp; delivery", [
                  { title: "Payment method", value: data.paymentMethod },
                  { title: "Delivery option", value: data.shippingMethod },
                ])}
              </tr></table>
            </td></tr>

            <!-- Help -->
            <tr><td class="pad" style="padding:12px 40px 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px dashed #d1d5db;border-radius:10px;"><tr>
                <td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#4b5563;">
                  <strong style="color:#111827;">Need help with your order?</strong><br />
                  ${support}
                </td>
              </tr></table>
            </td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:24px 12px 4px 12px;">
          ${social ? `<div style="margin-bottom:10px;">${social}</div>` : ""}
          <div style="font-size:12px;color:#6b7280;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</div>
          <div style="font-size:12px;margin-top:2px;"><a href="${brand.siteUrl}" style="color:#6b7280;text-decoration:none;">${brand.siteUrl.replace(/^https?:\/\//, "")}</a></div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Thanks for your purchase, ${data.customerName}!`,
    `ORDER ${data.orderNumber} (${dateText})`,
    "",
    "We're getting your order ready to be shipped. We will notify you when it has been sent.",
    `View your order: ${orderUrl}`,
    "",
    "ORDER SUMMARY",
    ...data.items.map(
      (i) =>
        `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity}: ${money(i.price * i.quantity, currency)}`,
    ),
    `Subtotal: ${money(subtotal, currency)}`,
    `Shipping: ${money(shippingFee, currency)}`,
    discount ? `Discount: -${money(discount, currency)}` : "",
    `Total: ${money(total, currency)} ${currency}`,
    "",
    data.shippingAddress ? `Shipping address:\n${data.shippingAddress}\n` : "",
    data.paymentMethod ? `Payment: ${data.paymentMethod}` : "",
    data.shippingMethod ? `Shipping method: ${data.shippingMethod}` : "",
    "",
    brand.supportPhone ? `Customer Care: ${brand.supportPhone}` : "",
    `Email: ${brand.supportEmail}`,
    `${brand.name} – ${brand.siteUrl}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { subject, html, text };
}
