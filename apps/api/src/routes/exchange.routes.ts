import { ExchangeRepository } from "@reusedo/database";
import { counterOfferSchema, createExchangeSchema } from "@reusedo/validation";
import { type Request, type Response, Router } from "express";
import { ZodError } from "zod";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createExchangeSchema.parse(req.body);
    const exchange = await ExchangeRepository.createExchange(
      req.user?.profile?.id as string,
      validatedData,
    );
    res.status(201).json({ success: true, data: exchange });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, errors: error.issues });
    } else {
      console.error("Error creating exchange:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
});

router.get("/incoming", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchanges = await ExchangeRepository.getIncomingExchanges(req.user?.profile?.id as string);
    res.status(200).json({ success: true, data: exchanges });
  } catch (error) {
    console.error("Error fetching incoming exchanges:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/outgoing", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchanges = await ExchangeRepository.getOutgoingExchanges(req.user?.profile?.id as string);
    res.status(200).json({ success: true, data: exchanges });
  } catch (error) {
    console.error("Error fetching outgoing exchanges:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/history", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchanges = await ExchangeRepository.getExchangeHistory(req.user?.profile?.id as string);
    res.status(200).json({ success: true, data: exchanges });
  } catch (error) {
    console.error("Error fetching exchange history:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchange = await ExchangeRepository.getExchangeById(
      req.params.id,
      req.user?.profile?.id as string,
    );
    if (!exchange) {
      res.status(404).json({ success: false, message: "Exchange not found" });
      return;
    }
    res.status(200).json({ success: true, data: exchange });
  } catch (error) {
    console.error("Error fetching exchange details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:id/events", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchange = await ExchangeRepository.getExchangeById(
      req.params.id,
      req.user?.profile?.id as string,
    );
    if (!exchange) {
      res.status(404).json({ success: false, message: "Exchange not found" });
      return;
    }
    const events = await ExchangeRepository.getExchangeEvents(req.params.id);
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching exchange events:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Exchange actions
router.post("/:id/accept", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchange = await ExchangeRepository.getExchangeById(
      req.params.id,
      req.user?.profile?.id as string,
    );
    if (!exchange) {
      res.status(404).json({ success: false, message: "Exchange not found" });
      return;
    }

    if (exchange.status !== "pending" && exchange.status !== "counter_offered") {
      res
        .status(400)
        .json({ success: false, message: `Cannot accept exchange in status: ${exchange.status}` });
      return;
    }

    let canAct = false;
    if (exchange.status === "pending") {
      canAct = exchange.recipient_id === req.user?.profile?.id;
    } else if (exchange.status === "counter_offered") {
      const events = await ExchangeRepository.getExchangeEvents(req.params.id);
      const lastCounterEvent = [...events].reverse().find((e) => e.action === "counter_offered");
      if (lastCounterEvent) {
        canAct = lastCounterEvent.actor_id !== req.user?.profile?.id;
      }
    }

    if (!canAct) {
      res.status(403).json({ success: false, message: "Not authorized to accept this exchange" });
      return;
    }

    const updated = await ExchangeRepository.updateExchangeStatus(
      req.params.id,
      req.user?.profile?.id as string,
      "accepted",
      "accepted",
    );
    // Also mark as ready_for_shipping internally if needed or that could be a separate step

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error accepting exchange:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/:id/reject", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchange = await ExchangeRepository.getExchangeById(
      req.params.id,
      req.user?.profile?.id as string,
    );
    if (!exchange) {
      res.status(404).json({ success: false, message: "Exchange not found" });
      return;
    }

    if (exchange.status !== "pending" && exchange.status !== "counter_offered") {
      res
        .status(400)
        .json({ success: false, message: `Cannot reject exchange in status: ${exchange.status}` });
      return;
    }

    let canAct = false;
    if (exchange.status === "pending") {
      canAct = exchange.recipient_id === req.user?.profile?.id;
    } else if (exchange.status === "counter_offered") {
      const events = await ExchangeRepository.getExchangeEvents(req.params.id);
      const lastCounterEvent = [...events].reverse().find((e) => e.action === "counter_offered");
      if (lastCounterEvent) {
        canAct = lastCounterEvent.actor_id !== req.user?.profile?.id;
      }
    }

    if (!canAct) {
      res.status(403).json({ success: false, message: "Not authorized to reject this exchange" });
      return;
    }

    const updated = await ExchangeRepository.updateExchangeStatus(
      req.params.id,
      req.user?.profile?.id as string,
      "rejected",
      "rejected",
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error rejecting exchange:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/:id/cancel", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchange = await ExchangeRepository.getExchangeById(
      req.params.id,
      req.user?.profile?.id as string,
    );
    if (!exchange) {
      res.status(404).json({ success: false, message: "Exchange not found" });
      return;
    }

    if (
      exchange.status === "cancelled" ||
      exchange.status === "expired" ||
      exchange.status === "rejected"
    ) {
      res.status(400).json({ success: false, message: `Exchange is already ${exchange.status}` });
      return;
    }

    const updated = await ExchangeRepository.updateExchangeStatus(
      req.params.id,
      req.user?.profile?.id as string,
      "cancelled",
      "cancelled",
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error cancelling exchange:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/:id/counter", async (req: Request, res: Response): Promise<void> => {
  try {
    const exchange = await ExchangeRepository.getExchangeById(
      req.params.id,
      req.user?.profile?.id as string,
    );
    if (!exchange) {
      res.status(404).json({ success: false, message: "Exchange not found" });
      return;
    }

    if (exchange.status !== "pending" && exchange.status !== "counter_offered") {
      res
        .status(400)
        .json({ success: false, message: `Cannot counter offer in status: ${exchange.status}` });
      return;
    }

    let canAct = false;
    if (exchange.status === "pending") {
      canAct = exchange.recipient_id === req.user?.profile?.id;
    } else if (exchange.status === "counter_offered") {
      const events = await ExchangeRepository.getExchangeEvents(req.params.id);
      const lastCounterEvent = [...events].reverse().find((e) => e.action === "counter_offered");
      if (lastCounterEvent) {
        canAct = lastCounterEvent.actor_id !== req.user?.profile?.id;
      }
    }

    if (!canAct) {
      res.status(403).json({ success: false, message: "Not authorized to counter this exchange" });
      return;
    }

    const validatedData = counterOfferSchema.parse(req.body);
    const updated = await ExchangeRepository.counterOffer(
      req.params.id,
      req.user?.profile?.id as string,
      validatedData,
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, errors: error.issues });
    } else {
      console.error("Error making counter offer:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
});

export default router;
