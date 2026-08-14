import { ShippingRepository } from "../database";
import { createShipmentSchema, updateShipmentSchema } from "../shared/validation";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";

export const shippingRouter = Router();

// Create shipment
shippingRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const validatedData = createShipmentSchema.parse(req.body);
    const shipment = await ShippingRepository.createShipment({
      ...validatedData,
      sender_id: req.user?.profile?.id as string, // Assuming req.user is set by requireAuth
    });
    res.status(201).json(shipment);
  } catch (error) {
    next(error);
  }
});

// Get user's shipments
shippingRouter.get("/my-shipments", requireAuth, async (req, res, next) => {
  try {
    const shipments = await ShippingRepository.getUserShipments(req.user?.profile?.id as string);
    res.json({ shipments });
  } catch (error) {
    next(error);
  }
});

// Get shipment by exchange ID
shippingRouter.get("/exchange/:exchangeId", requireAuth, async (req, res, next) => {
  try {
    const shipment = await ShippingRepository.getShipmentByExchange(req.params.exchangeId);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    // Verify user is sender or receiver
    if (shipment.sender_id !== req.user?.profile?.id && shipment.receiver_id !== req.user?.profile?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

// Get shipment by ID
shippingRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const shipment = await ShippingRepository.getShipment(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    if (shipment.sender_id !== req.user?.profile?.id && shipment.receiver_id !== req.user?.profile?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

// Update shipment
shippingRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const shipment = await ShippingRepository.getShipment(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    if (shipment.sender_id !== req.user?.profile?.id && shipment.receiver_id !== req.user?.profile?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const validatedData = updateShipmentSchema.parse(req.body);
    const updatedShipment = await ShippingRepository.updateShipment(req.params.id, validatedData);
    res.json(updatedShipment);
  } catch (error) {
    next(error);
  }
});
