import { productModel } from "../models/Product";

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        
        res.status(200).json({
            success: true,
            data: products,
            count: products.length,
            message: "Products retrieved successfully"
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

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product,
            message: "Product retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add new product
export const addProduct = async (req, res) => {
    try {
        const { title, level, image, status, priceRange, income, handling } = req.body;

        // Validation
        if (!title || !level || !image || !status || !priceRange || !income || !handling) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate priceRange structure
        if (!priceRange.min || !priceRange.max || priceRange.min > priceRange.max) {
            return res.status(400).json({
                success: false,
                message: "Invalid price range. Min and max values are required, and min should be less than or equal to max."
            });
        }

        // Check if product with same title already exists
        const existingProduct = await productModel.findOne({ title: title.trim() });
        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product with this title already exists"
            });
        }

        // Create new product
        const newProduct = new productModel({
            title: title.trim(),
            level: level.trim(),
            image: image.trim(),
            status: status.trim(),
            priceRange: {
                min: Number(priceRange.min),
                max: Number(priceRange.max)
            },
            income: income.trim(),
            handling: handling.trim()
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            success: true,
            data: savedProduct,
            message: "Product added successfully"
        });
    } catch (error) {
        console.error("Error adding product:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, level, image, status, priceRange, income, handling } = req.body;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        // Validate priceRange if provided
        if (priceRange && (!priceRange.min || !priceRange.max || priceRange.min > priceRange.max)) {
            return res.status(400).json({
                success: false,
                message: "Invalid price range. Min and max values are required, and min should be less than or equal to max."
            });
        }

        // Check if another product with same title exists (excluding current product)
        if (title) {
            const existingProduct = await productModel.findOne({ 
                title: title.trim(), 
                _id: { $ne: id } 
            });
            if (existingProduct) {
                return res.status(409).json({
                    success: false,
                    message: "Product with this title already exists"
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (level) updateData.level = level.trim();
        if (image) updateData.image = image.trim();
        if (status) updateData.status = status.trim();
        if (priceRange) {
            updateData.priceRange = {
                min: Number(priceRange.min),
                max: Number(priceRange.max)
            };
        }
        if (income) updateData.income = income.trim();
        if (handling) updateData.handling = handling.trim();

        const updatedProduct = await productModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: updatedProduct,
            message: "Product updated successfully"
        });
    } catch (error) {
        console.error("Error updating product:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete single product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        const deletedProduct = await productModel.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: deletedProduct,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete multiple products
export const deleteMultipleProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of product IDs"
            });
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format",
                invalidIds
            });
        }

        const result = await productModel.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            deletedCount: result.deletedCount,
            message: `${result.deletedCount} product(s) deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting products:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get products by status
export const getProductsByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const products = await productModel.find({ status: status });

        res.status(200).json({
            success: true,
            data: products,
            count: products.length,
            message: `Products with status '${status}' retrieved successfully`
        });
    } catch (error) {
        console.error("Error fetching products by status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get products by level
export const getProductsByLevel = async (req, res) => {
    try {
        const { level } = req.params;

        const products = await productModel.find({ level: level });

        res.status(200).json({
            success: true,
            data: products,
            count: products.length,
            message: `Products with level '${level}' retrieved successfully`
        });
    } catch (error) {
        console.error("Error fetching products by level:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get products by price range
export const getProductsByPriceRange = async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query;

        if (!minPrice || !maxPrice) {
            return res.status(400).json({
                success: false,
                message: "Both minPrice and maxPrice are required"
            });
        }

        const products = await productModel.find({
            "priceRange.min": { $gte: Number(minPrice) },
            "priceRange.max": { $lte: Number(maxPrice) }
        });

        res.status(200).json({
            success: true,
            data: products,
            count: products.length,
            message: `Products in price range ${minPrice} - ${maxPrice} retrieved successfully`
        });
    } catch (error) {
        console.error("Error fetching products by price range:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Search products
export const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const products = await productModel.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { level: { $regex: query, $options: 'i' } },
                { status: { $regex: query, $options: 'i' } },
                { income: { $regex: query, $options: 'i' } },
                { handling: { $regex: query, $options: 'i' } }
            ]
        });

        res.status(200).json({
            success: true,
            data: products,
            count: products.length,
            message: `Search results for '${query}'`
        });
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};