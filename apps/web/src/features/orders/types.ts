export interface OrderItem {
  name: string;
  quantity: number;
  /** Unit price in whole currency units, e.g. 1250 */
  price: number;
  variant?: string;
  imageUrl?: string;
}

export interface OrderConfirmationData {
  orderNumber: string;
  orderDate: string | Date;
  customerName: string;
  items: OrderItem[];
  shippingFee?: number;
  discount?: number;
  currency?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingAddress?: string;
}
