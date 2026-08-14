import {
  createSavedSearchSchema,
  logSearchAnalyticsSchema,
  recentlyViewedSchema,
  searchFiltersSchema,
} from "../shared/validation";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { SearchService } from "../services/search.service";

export const searchRouter = Router();

// Global Search
searchRouter.get("/", async (req, res) => {
  try {
    // Zod parsing of query params requires converting strings to matching types, but we'll let validation schema handle basic types.
    // We should parse offset/limit strings to numbers
    const parsedQuery = {
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };

    const filters = searchFiltersSchema.parse(parsedQuery);
    const results = await SearchService.getGlobalSearch(filters);
    res.json(results);
  } catch (error) {
    console.error("Global search error:", error);
    res.status(400).json({ success: false, message: "Search failed" });
  }
});

// Products Search
searchRouter.get("/products", async (req, res) => {
  try {
    const parsedQuery = {
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };
    const filters = searchFiltersSchema.parse(parsedQuery);
    const results = await SearchService.searchProducts(filters);
    res.json(results);
  } catch (error) {
    res.status(400).json({ success: false, message: "Search failed" });
  }
});

// Needs Search
searchRouter.get("/needs", async (req, res) => {
  try {
    const parsedQuery = {
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };
    const filters = searchFiltersSchema.parse(parsedQuery);
    const results = await SearchService.searchNeeds(filters);
    res.json(results);
  } catch (error) {
    res.status(400).json({ success: false, message: "Search failed" });
  }
});

// Users Search
searchRouter.get("/users", async (req, res) => {
  try {
    const parsedQuery = {
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };
    const filters = searchFiltersSchema.parse(parsedQuery);
    const results = await SearchService.searchUsers(filters);
    res.json(results);
  } catch (error) {
    res.status(400).json({ success: false, message: "Search failed" });
  }
});

// Saved Searches
searchRouter.post("/saved", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.profile) return res.status(401).json({ error: "Unauthorized" });
    const parseResult = createSavedSearchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid data", details: parseResult.error.format() });
    }
    const saved = await SearchService.saveSearch(req.user.profile.id, parseResult.data);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Save Search Error:", error);
    res.status(500).json({ error: "Failed to save search" });
  }
});

searchRouter.get("/saved", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.profile) return res.status(401).json({ error: "Unauthorized" });
    const searches = await SearchService.getSavedSearches(req.user.profile.id);
    res.json(searches);
  } catch (error) {
    console.error("Get Saved Searches Error:", error);
    res.status(500).json({ error: "Failed to fetch saved searches" });
  }
});

searchRouter.delete("/saved/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.profile) return res.status(401).json({ error: "Unauthorized" });
    await SearchService.deleteSavedSearch(req.params.id, req.user.profile.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Saved Search Error:", error);
    res.status(500).json({ error: "Failed to delete saved search" });
  }
});

// Recently Viewed API
searchRouter.get("/recently-viewed", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.profile) return res.status(401).json({ error: "Unauthorized" });
    const viewed = await SearchService.getRecentlyViewed(req.user.profile.id);
    res.json(viewed);
  } catch (error) {
    console.error("Get Recently Viewed Error:", error);
    res.status(500).json({ error: "Failed to fetch recently viewed items" });
  }
});

searchRouter.post("/recently-viewed", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.profile) return res.status(401).json({ error: "Unauthorized" });
    const { item_type, item_id } = req.body;
    await SearchService.logRecentlyViewed(req.user.profile.id, item_type, item_id);
    res.json({ success: true });
  } catch (error) {
    console.error("Log Recently Viewed Error:", error);
    res.status(500).json({ error: "Failed to log recently viewed item" });
  }
});

// Recommendations API
searchRouter.get("/recommendations", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.profile) return res.status(401).json({ error: "Unauthorized" });
    const recommendations = await SearchService.getRecommendations(req.user.profile.id);
    res.json(recommendations);
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to fetch recommendations" });
  }
});

searchRouter.get("/similar/products/:id", async (req, res) => {
  try {
    const categoryId = req.query.categoryId as string;
    if (!categoryId) return res.status(400).json({ error: "categoryId required" });
    const similar = await SearchService.getSimilarProducts(req.params.id, categoryId);
    res.json(similar);
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to fetch similar products" });
  }
});

// Analytics
searchRouter.post("/analytics", async (req, res) => {
  try {
    const data = logSearchAnalyticsSchema.parse(req.body);
    // user uid is optional here
    const userId = req.user?.profile?.id || null;
    await SearchService.logSearchAnalytics(userId, data);
    res.json({ success: true });
  } catch (error) {
    // Analytics failures shouldn't break the client
    res.status(200).json({ success: false });
  }
});
