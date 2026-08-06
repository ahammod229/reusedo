import { NeedRepository, OfferRepository } from "@reusedo/database";
import { createNeedSchema, submitOfferSchema, updateNeedSchema } from "@reusedo/validation";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.get("/", async (req, res, next) => {
  try {
    const { category_id, district, status } = req.query;
    const needs = await NeedRepository.getNeeds({
      category_id: category_id as string,
      district: district as string,
      status: status as string,
    });
    res.json(needs);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const need = await NeedRepository.getNeedById(req.params.id);
    if (!need) {
      res.status(404).json({ message: "Need request not found" });
      return;
    }
    res.json(need);
  } catch (error) {
    next(error);
  }
});

// Protected routes (require auth)
router.use(requireAuth);

router.get("/me/needs", async (req, res, next) => {
  try {
    const { status } = req.query;
    const needs = await NeedRepository.getMyNeeds(req.user?.profile?.id as string, status as string);
    res.json(needs);
  } catch (error) {
    next(error);
  }
});

router.get("/me/offers", async (req, res, next) => {
  try {
    const offers = await OfferRepository.getMyOffers(req.user?.profile?.id as string);
    res.json(offers);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createNeedSchema.parse(req.body);
    const status =
      req.body.status && ["draft", "published"].includes(req.body.status)
        ? req.body.status
        : "draft";
    const need = await NeedRepository.createNeed(req.user?.profile?.id as string, payload, status);
    res.status(201).json(need);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = updateNeedSchema.parse(req.body);
    const dataToUpdate: typeof updates & { status?: string } = { ...updates };
    if (req.body.status) {
      dataToUpdate.status = req.body.status;
    }
    const need = await NeedRepository.updateNeed(
      req.params.id,
      req.user?.profile?.id as string,
      dataToUpdate,
    );
    res.json(need);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await NeedRepository.deleteNeed(req.params.id, req.user?.profile?.id as string);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/publish", async (req, res, next) => {
  try {
    const need = await NeedRepository.updateNeed(req.params.id, req.user?.profile?.id as string, {
      status: "published",
    });
    res.json(need);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/archive", async (req, res, next) => {
  try {
    const need = await NeedRepository.updateNeed(req.params.id, req.user?.profile?.id as string, {
      status: "archived",
    });
    res.json(need);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/offers", async (req, res, next) => {
  try {
    const offers = await OfferRepository.getOffersByNeedId(req.params.id);
    res.json(offers);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/offers", async (req, res, next) => {
  try {
    const parsedData = submitOfferSchema.parse(req.body);
    const offer = await OfferRepository.submitOffer(
      req.params.id,
      req.user?.profile?.id as string,
      parsedData.product_id,
    );
    res.status(201).json(offer);
  } catch (error) {
    next(error);
  }
});

export default router;
