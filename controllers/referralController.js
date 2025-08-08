import { referralModel } from "../models/Referral.modal.js";

const createReferralPercentage = async (req, res) => {
  try {
    const { percentage } = req.body;
    const userId = req.userId;

    if (!userId || percentage === undefined) {
      return res.status(400).json({
        success: false,
        message: "User authentication required and percentage is required",
      });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage should be between 0 and 100",
      });
    }

    // Check if referral already exists
    const existingReferral = await referralModel.findOne({ userId });

    if (existingReferral) {
      // Update percentage
      existingReferral.percentage = percentage;
      const updated = await existingReferral.save();

      return res.status(200).json({
        success: true,
        message: "Referral percentage updated successfully",
        data: updated,
      });
    }

    // Create new referral
    const newReferral = new referralModel({
      userId,
      percentage,
    });

    const savedReferral = await newReferral.save();

    return res.status(201).json({
      success: true,
      message: "Referral percentage created successfully",
      data: savedReferral,
    });
  } catch (error) {
    console.error("Error in referral percentage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getReferralPercentage = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Find referral settings for the user
    const referralSettings = await referralModel.findOne({ userId });

    if (!referralSettings) {
      // If no referral settings found, return default percentage
      return res.status(200).json({
        success: true,
        message: "No referral settings found, returning default",
        data: {
          userId,
          percentage: 5, // Default percentage
          isDefault: true,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral percentage retrieved successfully",
      data: referralSettings,
    });
  } catch (error) {
    console.error("Error in getting referral percentage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { createReferralPercentage, getReferralPercentage };
