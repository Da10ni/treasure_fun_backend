// import { productModel } from "../models/Product.js";
// import { uploadToCloudinary } from "../services/cloudinaryService.js";

// // Add a new product
// export const addProduct = async (req, res) => {
//     try {
//         const { title, status, priceRange, income, handlingFee } = req.body;
//         const creatorId = req.userId;
//         const imageFile = req.file;
        
//         console.log("check image file:", imageFile);
        
//         // Validate required fields
//         if (!title || !status || !priceRange || !income || !handlingFee) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             });
//         }

//         // Validate image file
//         if (!imageFile) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Product image is required"
//             });
//         }

//         // Parse priceRange if it's a string (comes from FormData as JSON string)
//         let parsedPriceRange;
//         try {
//             parsedPriceRange = typeof priceRange === 'string' ? JSON.parse(priceRange) : priceRange;
//         } catch (error) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid price range format"
//             });
//         }

//         // Validate priceRange structure
//         if (!parsedPriceRange.min || !parsedPriceRange.max) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Price range must include both min and max values"
//             });
//         }

//         // Validate that min is less than max
//         if (Number(parsedPriceRange.min) >= Number(parsedPriceRange.max)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Minimum price must be less than maximum price"
//             });
//         }

//         // Upload image to Cloudinary
//         let imageUrl;
//         try {
//             console.log("Uploading image to Cloudinary...");
//             const uploadResult = await uploadToCloudinary(imageFile, 'products');
//             imageUrl = uploadResult.url;
//             console.log("Image uploaded successfully:", imageUrl);
//         } catch (error) {
//             console.error("Cloudinary upload error:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: "Failed to upload image",
//                 error: error.message
//             });
//         }

//         // Create new product
//         const newProduct = new productModel({
//             title,
//             image: imageUrl, // Set the Cloudinary URL
//             status,
//             priceRange: {
//                 min: Number(parsedPriceRange.min),
//                 max: Number(parsedPriceRange.max)
//             },
//             income: Number(income),
//             handlingFee,
//             creator: creatorId
//         });

//         const savedProduct = await newProduct.save();

//         res.status(201).json({
//             success: true,
//             message: "Product added successfully",
//             data: savedProduct
//         });

//     } catch (error) {
//         console.error("Error adding product:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };

// // Get all products
// export const getAllProducts = async (req, res) => {
//     try {
//         const products = await productModel.find({}).populate("creator");

//         res.status(200).json({
//             success: true,
//             message: "Products retrieved successfully",
//             count: products.length,
//             data: products
//         });

//     } catch (error) {
//         console.error("Error fetching products:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };

// // Delete a product
// export const deleteProduct = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Check if product exists
//         const product = await productModel.findById(id);
//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found"
//             });
//         }

//         // Delete the product
//         await productModel.findByIdAndDelete(id);

//         res.status(200).json({
//             success: true,
//             message: "Product deleted successfully"
//         });

//     } catch (error) {
//         console.error("Error deleting product:", error);

//         // Handle invalid ObjectId error
//         if (error.name === 'CastError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid product ID format"
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };
// export const getActiveProducts = async (req, res) => {
//     try {
//         const activeProducts = await productModel.find({ status: 'active' }).populate("creator");

//         res.status(200).json({
//             success: true,
//             message: "Active products retrieved successfully",
//             count: activeProducts.length,
//             data: activeProducts
//         });

//     } catch (error) {
//         console.error("Error fetching active products:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };
// // Get single product by ID
// export const getProductById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Find product by ID
//         const product = await productModel.findById(id);

//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Product retrieved successfully",
//             data: product
//         });

//     } catch (error) {
//         console.error("Error fetching product:", error);

//         // Handle invalid ObjectId error
//         if (error.name === 'CastError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid product ID format"
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };

import { productModel } from "../models/Product.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";

// Add a new product
export const addProduct = async (req, res) => {
    try {
        const { title, status, priceRange, income, handlingFee, duration } = req.body;
        const creatorId = req.userId;
        const imageFile = req.file;
        
        console.log("check image file:", imageFile);
        console.log("product data:", { title, status, priceRange, income, handlingFee, duration });
        
        // Validate required fields
        if (!title || !status || !priceRange || !income || !handlingFee || !duration) {
            return res.status(400).json({
                success: false,
                message: "All fields are required including duration"
            });
        }

        // Validate image file
        if (!imageFile) {
            return res.status(400).json({
                success: false,
                message: "Product image is required"
            });
        }

        // Parse priceRange if it's a string (comes from FormData as JSON string)
        let parsedPriceRange;
        try {
            parsedPriceRange = typeof priceRange === 'string' ? JSON.parse(priceRange) : priceRange;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid price range format"
            });
        }

        // Validate priceRange structure
        if (!parsedPriceRange.min || !parsedPriceRange.max) {
            return res.status(400).json({
                success: false,
                message: "Price range must include both min and max values"
            });
        }

        // Validate that min is less than max
        if (Number(parsedPriceRange.min) >= Number(parsedPriceRange.max)) {
            return res.status(400).json({
                success: false,
                message: "Minimum price must be less than maximum price"
            });
        }

        // 🔥 Validate duration
        const durationDays = Number(duration);
        if (!durationDays || durationDays < 1 || durationDays > 365) {
            return res.status(400).json({
                success: false,
                message: "Duration must be between 1 and 365 days"
            });
        }

        // Upload image to Cloudinary
        let imageUrl;
        try {
            console.log("Uploading image to Cloudinary...");
            const uploadResult = await uploadToCloudinary(imageFile, 'products');
            imageUrl = uploadResult.url;
            console.log("Image uploaded successfully:", imageUrl);
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload image",
                error: error.message
            });
        }

        // Create new product
        const newProduct = new productModel({
            title,
            image: imageUrl,
            status,
            priceRange: {
                min: Number(parsedPriceRange.min),
                max: Number(parsedPriceRange.max)
            },
            income: Number(income),
            duration: durationDays, // 🔥 Add duration field
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