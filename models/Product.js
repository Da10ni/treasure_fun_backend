// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema(
//     {
//         title: {
//             type: String,
//             required: true,
//         },

//         image: {
//             type: String,
//             required: true,
//         },
//         status: {
//             type: String,
//             required: true,
//         },
//         priceRange: {
//             min: {
//                 type: Number,
//                 required: true
//             },
//             max: {
//                 type: Number,
//                 required: true
//             }
//         },
//         income: {
//             type: Number,
//             required: true,
//             min: 0,
//             max: 100
//         },
//         handlingFee: {
//             type: String,
//             required: true,
//         },
//         creator: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Admin",
//             required: true
//         }

//     });
// export const productModel =
//     mongoose.models.Product || mongoose.model("Product", productSchema);


import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
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
            type: Number,
            required: true,
            min: 0,
        },
        duration: {
            type: Number,
            required: true,
            min: 1,
            max: 365,
            default: 7 // Default 7 days
        },
        handlingFee: {
            type: String,
            required: true,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        }
    },
    {
        timestamps: true // Adds createdAt and updatedAt automatically
    }
);

export const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);