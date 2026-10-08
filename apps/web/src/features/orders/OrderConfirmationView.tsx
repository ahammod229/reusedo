import { Link } from "react-router";
import type { OrderConfirmationData } from "./types";

// Keep these in sync with the order confirmation email (apps/api/src/services/email).
const NAVY = "#173e65";
const NAVY_DARK = "#0f2b47";
const RED = "#bc1823";

const SUPPORT_EMAIL = "support@noklity.com";
const SUPPORT_PHONE = "+8801713812668";

const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"] as const;

const money = (amount: number, currency: string) =>
  `${currency === "BDT" ? "Tk" : currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
    style={{ color: NAVY }}
  >
    {children}
  </div>
);

const InfoCard = ({
  label,
  rows,
}: {
  label: string;
  rows: { title?: string; value?: string }[];
}) => {
  const visible = rows.filter((r) => r.value);
  if (visible.length === 0) return null;
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4">
      <div
        className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em]"
        style={{ color: NAVY }}
      >
        <span style={{ color: RED }}>■</span>&nbsp; {label}
      </div>
      {visible.map((r) => (
        <div key={r.title ?? r.value} className="mt-2.5 first:mt-0">
          {r.title && <div className="text-xs font-semibold text-gray-500">{r.title}</div>}
          <div className="whitespace-pre-line text-sm leading-relaxed text-gray-800">{r.value}</div>
        </div>
      ))}
    </div>
  );
};

export function OrderConfirmationView({ order }: { order: OrderConfirmationData }) {
  const currency = order.currency ?? "BDT";
  const shippingFee = order.shippingFee ?? 0;
  const discount = order.discount ?? 0;
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + shippingFee - discount;
  const dateText = new Date(order.orderDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-[600px] px-3 pt-8 pb-24 text-gray-900 md:pb-8">
      {/* Logo */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <img src="/email-logo.png" alt="Noklity" className="h-11 w-auto" />
        <span className="text-[22px] font-extrabold tracking-[0.16em]" style={{ color: NAVY }}>
          NOKLITY
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(23,62,101,0.08)]">
        {/* Hero */}
        <div
          className="px-6 py-10 text-center sm:px-10"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 100%)` }}
        >
          <div
            className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-[26px] font-bold"
            style={{ color: RED }}
          >
            ✓
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-[28px]">Order confirmed</h1>
          <p className="mx-auto mb-5 max-w-sm text-[15px] leading-relaxed text-slate-300">
            Thank you, {order.customerName}. We&rsquo;ve received your order and will let you know
            as soon as it ships.
          </p>
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-5 py-2 text-[13px] text-slate-200">
            Order <strong className="text-[15px] text-white">#{order.orderNumber}</strong>
            &nbsp;·&nbsp; {dateText}
          </span>
        </div>

        <div className="px-5 pb-9 sm:px-10">
          {/* Tracker */}
          <div className="grid grid-cols-4 gap-1 pt-7">
            {STEPS.map((label, idx) => {
              const active = idx === 0;
              return (
                <div key={label} className="text-center">
                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                      active ? "text-white" : "bg-gray-200 text-gray-400"
                    }`}
                    style={active ? { background: RED } : undefined}
                  >
                    {active ? "✓" : idx + 1}
                  </div>
                  <div
                    className={`mt-1.5 text-[11px] ${
                      active ? "font-bold text-gray-900" : "font-medium text-gray-400"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="py-6 text-center">
            <Link
              to="/"
              className="inline-block rounded-[10px] px-9 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: RED }}
            >
              Continue shopping
            </Link>
          </div>

          {/* Items */}
          <SectionLabel>Your items</SectionLabel>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {order.items.map((item, idx) => (
              <div
                key={`${item.name}-${item.variant ?? ""}`}
                className={`flex items-center gap-3.5 p-3.5 ${
                  idx < order.items.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded-[10px] border border-gray-200 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-snug text-gray-900">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-[13px] text-gray-500">
                    {item.variant ? `${item.variant} · ` : ""}Qty {item.quantity}
                  </div>
                </div>
                <div className="whitespace-nowrap text-[15px] font-bold">
                  {money(item.price * item.quantity, currency)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 px-1 pt-4 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-700">{money(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-gray-700">{money(shippingFee, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-semibold text-gray-700">− {money(discount, currency)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-slate-100 px-4 py-4">
            <span className="text-sm font-semibold text-gray-700">Total amount</span>
            <span className="text-2xl font-extrabold" style={{ color: NAVY }}>
              {money(total, currency)}{" "}
              <span className="text-xs font-semibold text-gray-500">{currency}</span>
            </span>
          </div>

          {/* Info cards */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Shipping to" rows={[{ value: order.shippingAddress }]} />
            <InfoCard
              label="Payment & delivery"
              rows={[
                { title: "Payment method", value: order.paymentMethod },
                { title: "Delivery option", value: order.shippingMethod },
              ]}
            />
          </div>

          {/* Help */}
          <div className="mt-4 rounded-[10px] border border-dashed border-gray-300 bg-slate-50 p-4 text-sm leading-7 text-gray-600">
            <strong className="text-gray-900">Need help with your order?</strong>
            <br />
            <a href={`tel:${SUPPORT_PHONE}`} className="font-bold text-gray-900">
              {SUPPORT_PHONE}
            </a>
            <br />
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold no-underline"
              style={{ color: NAVY }}
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Noklity. All rights reserved.
      </p>
    </div>
  );
}
