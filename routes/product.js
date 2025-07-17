import express from "express";
import { addProduct, getAllProducts, deleteProduct } from "../controllers/productController.js";

const router = express.Router();

// POST /api/products - Add a new product
router.post("/addproducts", addProduct);

// GET /api/products - Get all products
router.get("/allproducts", getAllProducts);

// DELETE /api/products/:id - Delete a product by ID
router.delete("/delete-products:id", deleteProduct);

export default router;