import express from "express";
import { 
  addProduct, 
  getAllProducts, 
  deleteProduct, 
  getActiveProducts, 
  getProductById 
} from "../controllers/productController.js";
import { authenticateAdmin, authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================

// Get active products - PUBLIC (Users can see available products for deposit)
// GET /api/products/active-products
router.get("/active-products", getActiveProducts);

// Get single product by ID - PUBLIC (Users need to see product details)
// GET /api/products/:id
router.get("/products/:id", getProductById);

// =============================================
// USER ROUTES (authenticateUser) - If needed
// =============================================

// Note: Most product viewing can be public since users need to see products to make deposits
// Add user routes here if you need user-specific product features

// =============================================
// ADMIN-ONLY ROUTES (authenticateAdmin)
// =============================================

// Add new product - ADMIN ONLY
// POST /api/products/addproducts
router.post("/addproducts", authenticateAdmin, addProduct);

// Get all products (including inactive) - ADMIN ONLY
// GET /api/products/allproducts
router.get("/allproducts", authenticateAdmin, getAllProducts);

// Delete product - ADMIN ONLY
// DELETE /api/products/delete-products/:id (Fixed missing slash)
router.delete("/delete-products/:id", authenticateAdmin, deleteProduct);

export default router;