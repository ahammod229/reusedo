import { Router } from "express";
import { CategoryRepository } from "@reusedo/database";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await CategoryRepository.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const category = await CategoryRepository.getCategoryBySlug(req.params.slug);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
});

export default router;
