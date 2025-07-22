import { referralModel } from "../models/Referral.modal.js";

const createReferralPercentage = async (req, res) => {
    try {
        const { basicPlan } = req.body;
        const userId = req.userId;

        if (!userId || basicPlan === undefined) {
            return res.status(400).json({
                success: false,
                message: "User authentication required and percentage is required"
            });
        }

        // Percentage validation (0-100 range)
        if (basicPlan < 0 || basicPlan > 100) {
            return res.status(400).json({
                success: false,
                message: "Percentage should be between 0 and 100"
            });
        }

        // Check if referral already exists for this admin
        const existingReferral = await referralModel.findOne({ userId });

        if (existingReferral) {
            return res.status(409).json({
                success: false,
                message: "Referral percentage already set by this admin"
            });
        }

        // Create new referral
        const newReferral = new referralModel({
            userId,
            percentage: basicPlan
        });

        const savedReferral = await newReferral.save();

        return res.status(201).json({
            success: true,
            message: "Referral percentage created successfully",
            data: savedReferral
        });

    } catch (error) {
        console.error("Error creating referral percentage:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export {
    createReferralPercentage
}