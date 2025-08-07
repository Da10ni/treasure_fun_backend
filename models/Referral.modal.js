import mongoose from "mongoose";

const referralSchema = mongoose.Schema({
    percentage: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true
})

export const referralModel = mongoose.models.referrals || mongoose.model("Referral", referralSchema)