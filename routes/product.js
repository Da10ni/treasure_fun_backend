import express from "express";
import { addProduct, getAllProducts, deleteProduct, getActiveProducts, getProductById } from "../controllers/productController.js";

const router = express.Router();

router.post("/addproducts", addProduct);

router.get("/allproducts", getAllProducts);

router.delete("/delete-products:id", deleteProduct);

router.get("/active-products", getActiveProducts);
// In your routes file
router.get('/products/:id', getProductById);

export default router;