import express from "express";
import {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    getProductsByStatus,
    getProductsByLevel,
    getProductsByPriceRange,
    searchProducts
} from "../controllers/productController.js"; // Update path as needed
import { authMiddleware } from "../middleware/authMiddleware.js"; // Update path as needed

const router = express.Router();

// Public routes (no authentication required)
router.get("/products", getAllProducts);
router.get("/products/search", searchProducts);
router.get("/products/status/:status", getProductsByStatus);
router.get("/products/level/:level", getProductsByLevel);
router.get("/products/price-range", getProductsByPriceRange);
router.get("/products/:id", getProductById);

// Protected routes (authentication required)
// Uncomment the line below if you want to protect product creation/modification
// router.use(authMiddleware);

// Product management routes
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.delete("/products", deleteMultipleProducts);

export default router;