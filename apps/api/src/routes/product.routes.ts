import { ProductRepository } from "../database";
import { getSupabaseClient } from "../database/client";
import { createProductSchema, updateProductSchema } from "../shared/validation";
import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Public routes
router.get("/", async (req, res, next) => {
  try {
    const { category_id, district, status } = req.query;
    const products = await ProductRepository.getProducts({
      category_id: category_id as string,
      district: district as string,
      status: status as string,
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
    const products = await ProductRepository.getMyProducts(
      req.user?.profile?.id as string,
      status as string,
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createProductSchema.parse(req.body);
    // Explicit status parsing, default to draft
    const status =
      req.body.status && ["draft", "published"].includes(req.body.status)
        ? req.body.status
        : "draft";
    const product = await ProductRepository.createProduct(req.user?.profile?.id as string, payload, status);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = updateProductSchema.parse(req.body);
    const product = await ProductRepository.updateProduct(
      req.params.id,
      req.user?.profile?.id as string,
      updates,
    );
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await ProductRepository.deleteProduct(req.params.id, req.user?.profile?.id as string);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/publish", async (req, res, next) => {
  try {
    const product = await ProductRepository.updateProduct(req.params.id, req.user?.profile?.id as string, {
      status: "published",
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/archive", async (req, res, next) => {
  try {
    const product = await ProductRepository.updateProduct(req.params.id, req.user?.profile?.id as string, {
      status: "archived",
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/images", upload.single("file"), async (req, res, next) => {
  try {
    const product = await ProductRepository.getProductById(req.params.id);
    if (!product || product.owner_id !== req.user?.profile?.id) {
      res.status(403).json({ error: "Product not found or access denied." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Only image files are allowed." });
      return;
    }

    const supabase = getSupabaseClient(true);
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${req.params.id}/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    const currentImages = product.images || [];

    // Update the product in the database with the new image URL
    const updatedProduct = await ProductRepository.updateProduct(
      req.params.id,
      req.user?.profile?.id as string,
      { images: [...currentImages, imageUrl] },
    );

    res.status(201).json({ url: imageUrl, product: updatedProduct });
  } catch (error) {
    next(error);
  }
});

export default router;
