import type { CreateShipmentInput, UpdateShipmentInput } from "@/shared/validation";
import { apiClient } from "../index";
export interface Shipment {
  id: string;
  exchange_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const ShippingService = {
  async createShipment(data: CreateShipmentInput): Promise<Shipment> {
    const { data: shipment } = await apiClient.post("/shipping", data);
    return shipment;
  },

  async getUserShipments(): Promise<{ shipments: Shipment[] }> {
    const { data } = await apiClient.get("/shipping/my-shipments");
    return data;
  },

  async getShipment(id: string): Promise<Shipment> {
    const { data } = await apiClient.get(`/shipping/${id}`);
    return data;
  },

  async getShipmentByExchange(exchangeId: string): Promise<Shipment> {
    const { data } = await apiClient.get(`/shipping/exchange/${exchangeId}`);
    return data;
  },

  async updateShipment(id: string, data: UpdateShipmentInput): Promise<Shipment> {
    const { data: shipment } = await apiClient.patch(`/shipping/${id}`, data);
    return shipment;
  },
};
