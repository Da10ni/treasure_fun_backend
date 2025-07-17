import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        level: {
            type: String,
            required: true
        },

        image: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        priceRange: {
            min: {
                type: Number,
                required: true
            },
            max: {
                type: Number,
                required: true
            }
        },
        income: {
            type: String,
            required: true,
        },
        handling: {
            type: String,
            required: true,
        }

    });
    export const productModel =
      mongoose.models.Product || mongoose.model("Product", productSchema);
