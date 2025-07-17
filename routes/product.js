import express from "express";
import { addProduct, getAllProducts, deleteProduct } from "../controllers/productController.js";

const router = express.Router();

router.post("/addproducts", addProduct);

router.get("/allproducts", getAllProducts);

router.delete("/delete-products:id", deleteProduct);

export default router;