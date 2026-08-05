import { Router } from "express";
import { ProductRepository } from "@reusedo/database";
import { requireAuth } from "../middlewares/auth.middleware";
import { createProductSchema, updateProductSchema } from "@reusedo/validation";

const router = Router();

// Public routes
router.get("/", async (req, res, next) => {
  try {
    const { category_id, district, status } = req.query;
    const products = await ProductRepository.getProducts({ 
      category_id: category_id as string, 
      district: district as string, 
      status: status as string 
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await ProductRepository.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Protected routes (require auth)
router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    const { status } = req.query;
    // req.user is set by requireAuth middleware
    const products = await ProductRepository.getMyProducts(req.user?.uid as string, status as string);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createProductSchema.parse(req.body);
    // Explicit status parsing, default to draft
    const status = req.body.status && ['draft', 'published'].includes(req.body.status) ? req.body.status : 'draft';
    const product = await ProductRepository.createProduct(req.user?.uid as string, payload, status);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = updateProductSchema.parse(req.body);
    const product = await ProductRepository.updateProduct(req.params.id, req.user?.uid as string, updates);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await ProductRepository.deleteProduct(req.params.id, req.user?.uid as string);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/publish", async (req, res, next) => {
  try {
    const product = await ProductRepository.updateProduct(req.params.id, req.user?.uid as string, { status: "published" });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/archive", async (req, res, next) => {
  try {
    const product = await ProductRepository.updateProduct(req.params.id, req.user?.uid as string, { status: "archived" });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
