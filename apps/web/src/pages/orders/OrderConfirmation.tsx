import { OrderConfirmationView } from "@/features/orders/OrderConfirmationView";
import type { OrderConfirmationData } from "@/features/orders/types";
import { Link, useLocation } from "react-router";

/**
 * Shown right after an order is placed. The checkout flow navigates here with the
 * order in router state:
 *   navigate(`/order-confirmation/${order.orderNumber}`, { state: { order } });
 */
export const OrderConfirmation = () => {
  const { state } = useLocation();
  const order = (state as { order?: OrderConfirmationData } | null)?.order;

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold">Order details not available</h1>
        <p className="mb-6 text-sm text-gray-500">
          We could not find this order confirmation. Check your email for the confirmation we sent
          you.
        </p>
        <Link to="/" className="font-semibold underline">
          Back to home
        </Link>
      </div>
    );
  }

  return <OrderConfirmationView order={order} />;
};
