import { productModel } from "../models/Product.js";

// Add a new product
export const addProduct = async (req, res) => {
    try {
        const { title, image, status, priceRange, income, handlingFee } = req.body;
        const creatorId = req.userId;
        console.log("creatorId", creatorId);
        // return
        // Validate required fields
        if (!title || !image || !status || !priceRange || !income || !handlingFee) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate priceRange structure
        if (!priceRange.min || !priceRange.max) {
            return res.status(400).json({
                success: false,
                message: "Price range must include both min and max values"
            });
        }

        // Validate that min is less than max
        if (priceRange.min >= priceRange.max) {
            return res.status(400).json({
                success: false,
                message: "Minimum price must be less than maximum price"
            });
        }

        // Create new product
        const newProduct = new productModel({
            title,
            image,
            status,
            priceRange: {
                min: priceRange.min,
                max: priceRange.max
            },
            income,
            handlingFee,
            creator: creatorId
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data: savedProduct
        });

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find({}).populate("creator");

        res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Delete the product
        await productModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting product:", error);

        // Handle invalid ObjectId error
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getActiveProducts = async (req, res) => {
    try {
        const activeProducts = await productModel.find({ status: 'active' }).populate("creator");

        res.status(200).json({
            success: true,
            message: "Active products retrieved successfully",
            count: activeProducts.length,
            data: activeProducts
        });

    } catch (error) {
        console.error("Error fetching active products:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find product by ID
        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product retrieved successfully",
            data: product
        });

    } catch (error) {
        console.error("Error fetching product:", error);

        // Handle invalid ObjectId error
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};