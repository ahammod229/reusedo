import "dotenv/config";

const API_URL = "http://localhost:8080/api";
let testUserId = "";
let testAuthToken = "";

async function runTests() {
  console.log("🚀 Starting End-to-End API Integration Tests...");
  try {
    // 1. Health Check
    console.log("\n[1] Testing Health Endpoint...");
    const healthRes = await fetch(`http://localhost:8080/health`);
    if (!healthRes.ok) throw new Error("Health check failed");
    console.log("✅ Health check passed");

    // 2. Fetch Public Products
    console.log("\n[2] Fetching Public Products...");
    const productsRes = await fetch(`${API_URL}/products`);
    const productsData = await productsRes.json();
    if (!Array.isArray(productsData)) {
      console.error(productsData);
      throw new Error("Failed to fetch products: Response is not an array");
    }
    console.log(`✅ Products fetched successfully. Count: ${productsData.length}`);
    
    // We can't fully simulate Firebase Auth login from a simple script without a real token or mocking the middleware.
    // The middleware expects a valid Firebase ID token.
    console.log("\n⚠️ Note: Skipping authenticated routes (Creation, Exchanges, Chat) because they require a real Firebase ID token via adminAuth.verifyIdToken().");
    
    // 3. Fetch Categories
    console.log("\n[3] Fetching Categories...");
    const categoriesRes = await fetch(`${API_URL}/categories`);
    const categoriesData = await categoriesRes.json();
    if (!Array.isArray(categoriesData)) {
      console.error(categoriesData);
      throw new Error("Failed to fetch categories: Response is not an array");
    }
    console.log(`✅ Categories fetched successfully. Count: ${categoriesData.length}`);

    console.log("\n🎉 Basic E2E API Integration Test Passed!");
  } catch (error) {
    console.error("\n❌ Test Failed:", error);
    process.exit(1);
  }
}

runTests();
