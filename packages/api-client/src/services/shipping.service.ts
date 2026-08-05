import { apiClient } from "../index";
import type { CreateShipmentInput, UpdateShipmentInput } from "@reusedo/validation";
import type { Shipment } from "@reusedo/database";

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
  }
};
