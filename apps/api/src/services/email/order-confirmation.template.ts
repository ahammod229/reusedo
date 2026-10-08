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
  supportEmail: process.env.SUPPORT_EMAIL || "noklitybd@gmail.com",
  supportPhone: process.env.SUPPORT_PHONE || undefined,
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
    .map((i) => {
      const image = i.imageUrl
        ? `<td width="76" valign="top" style="padding:16px 16px 16px 0;"><img src="${i.imageUrl}" width="60" height="60" alt="" style="display:block;width:60px;height:60px;border-radius:8px;border:1px solid #e5e7eb;object-fit:cover;" /></td>`
        : "";
      return `
        <tr>
          ${image}
          <td valign="top" style="padding:16px 0;border-bottom:1px solid #eef0f3;">
            <div style="font-size:15px;font-weight:600;line-height:1.4;color:#1f2937;">${escapeHtml(i.name)} <span style="color:#6b7280;font-weight:400;">&times; ${i.quantity}</span></div>
            ${i.variant ? `<div style="font-size:13px;color:#6b7280;margin-top:2px;">${escapeHtml(i.variant)}</div>` : ""}
          </td>
          <td align="right" valign="top" style="padding:16px 0 16px 12px;border-bottom:1px solid #eef0f3;font-size:15px;font-weight:600;color:#1f2937;white-space:nowrap;">${money(i.price * i.quantity, currency)}</td>
        </tr>`;
    })
    .join("");

  const line = (label: string, value: string) => `
        <tr>
          <td style="padding:4px 0;font-size:15px;color:#6b7280;">${label}</td>
          <td align="right" style="padding:4px 0;font-size:15px;font-weight:600;color:#374151;">${value}</td>
        </tr>`;

  const info = (label: string, value?: string) =>
    value
      ? `<td class="stack" width="50%" valign="top" style="padding:0 16px 28px 0;">
           <div style="font-size:15px;font-weight:600;color:#1f2937;margin-bottom:4px;">${label}</div>
           <div style="font-size:15px;line-height:1.55;color:#6b7280;">${escapeHtml(value).replace(/\n/g, "<br />")}</div>
         </td>`
      : "";

  const infoRow = (a: string, b: string) => (a || b ? `<tr>${a}${b}</tr>` : "");

  const support = [
    brand.supportPhone
      ? `Customer Care: <strong style="color:#111827;">${escapeHtml(brand.supportPhone)}</strong>${
          brand.supportHours ? ` <span style="color:#6b7280;">(${escapeHtml(brand.supportHours)})</span>` : ""
        }`
      : "",
    `Email: <a href="mailto:${brand.supportEmail}" style="color:${brand.primaryColor};text-decoration:none;font-weight:600;">${brand.supportEmail}</a>`,
  ]
    .filter(Boolean)
    .join("<br />");

  const social = (brand.social ?? [])
    .map(
      (s) =>
        `<a href="${s.url}" style="display:inline-block;margin:0 8px;font-size:13px;color:#6b7280;text-decoration:none;">${escapeHtml(s.label)}</a>`,
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
      .pad{padding-left:20px!important;padding-right:20px!important}
      .stack{display:block!important;width:100%!important;padding-right:0!important}
      .btn{display:block!important;text-align:center!important}
      .right{text-align:left!important;display:block!important;width:100%!important;padding-top:6px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Order ${orderNo} is confirmed. We are getting it ready to ship.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(17,24,39,.06);">

        <!-- Brand bar -->
        <tr><td style="height:5px;line-height:5px;font-size:0;background:${brand.primaryColor};">&nbsp;</td></tr>

        <!-- Header: logo left, order number right -->
        <tr><td class="pad" style="padding:26px 40px 8px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="middle"><a href="${brand.siteUrl}" style="text-decoration:none;">${logo}</a></td>
            <td class="right" align="right" valign="middle" style="font-size:13px;letter-spacing:.1em;color:#9ca3af;text-transform:uppercase;">Order ${orderNo}</td>
          </tr></table>
        </td></tr>

        <!-- Hero -->
        <tr><td class="pad" style="padding:28px 40px 4px 40px;">
          <h1 style="margin:0 0 10px 0;font-size:28px;line-height:1.25;font-weight:700;color:#111827;">Thanks for your purchase, ${name}!</h1>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#6b7280;">We&rsquo;re getting your order ready to be shipped. We will notify you when it has been sent.</p>
        </td></tr>

        <!-- Actions -->
        <tr><td class="pad" style="padding:24px 40px 8px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td class="btn" align="center" bgcolor="${brand.primaryColor}" style="border-radius:8px;"><a href="${orderUrl}" style="display:block;padding:15px 30px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">View your order</a></td>
            <td style="padding-left:16px;font-size:15px;color:#6b7280;">or <a href="${brand.siteUrl}" style="color:${brand.primaryColor};text-decoration:none;font-weight:600;">Visit our store</a></td>
          </tr></table>
        </td></tr>

        <!-- Order meta -->
        <tr><td class="pad" style="padding:28px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;"><tr>
            <td class="stack" style="padding:16px 20px;"><div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;">Order number</div><div style="font-size:20px;font-weight:800;color:${brand.primaryColor};margin-top:2px;">${orderNo}</div></td>
            <td class="stack" style="padding:16px 20px;"><div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;">Order date</div><div style="font-size:15px;font-weight:600;color:#374151;margin-top:4px;">${dateText}</div></td>
          </tr></table>
        </td></tr>

        <!-- Order summary -->
        <tr><td class="pad" style="padding:32px 40px 0 40px;">
          <h2 style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#111827;">Order summary</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            ${line("Subtotal", money(subtotal, currency))}
            ${line("Shipping", money(shippingFee, currency))}
            ${discount ? line("Discount", `&minus; ${money(discount, currency)}`) : ""}
            <tr><td colspan="2" style="padding-top:12px;"><div style="border-top:2px solid #e5e7eb;"></div></td></tr>
            <tr>
              <td style="padding:12px 0 0 0;font-size:16px;color:#374151;">Total</td>
              <td align="right" style="padding:12px 0 0 0;font-size:26px;font-weight:800;color:#111827;white-space:nowrap;">${money(total, currency)} <span style="font-size:13px;font-weight:600;color:#6b7280;">${escapeHtml(currency)}</span></td>
            </tr>
          </table>
        </td></tr>

        <!-- Customer information -->
        <tr><td class="pad" style="padding:36px 40px 0 40px;">
          <h2 style="margin:0 0 18px 0;font-size:20px;font-weight:700;color:#111827;">Customer information</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoRow(info("Shipping address", data.shippingAddress), info("Billing address", data.billingAddress ?? data.shippingAddress))}
            ${infoRow(info("Payment", data.paymentMethod), info("Shipping method", data.shippingMethod))}
          </table>
        </td></tr>

        <!-- Support -->
        <tr><td class="pad" style="padding:8px 40px 32px 40px;">
          <div style="border-top:1px solid #e5e7eb;padding-top:22px;font-size:14px;line-height:1.7;color:#4b5563;">
            If you have any questions about your order, our team is happy to help.<br /><br />
            ${support}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:22px 24px;">
          ${social ? `<div style="margin-bottom:10px;">${social}</div>` : ""}
          <div style="font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</div>
          <div style="font-size:12px;margin-top:2px;"><a href="${brand.siteUrl}" style="color:#9ca3af;text-decoration:none;">${brand.siteUrl.replace(/^https?:\/\//, "")}</a></div>
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
