import fs from "fs";
import { heroImageModel } from "../models/HeroImage.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";

const createHeroImage = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an image",
        success: false,
      });
    }

    // Get user ID from authenticated admin
    const userId = req.userId;

    // Upload to cloudinary
    const cloudinaryResponse = await uploadToCloudinary(req.file);

    console.log(cloudinaryResponse);

    if (!cloudinaryResponse || !cloudinaryResponse.url) {
      return res.status(500).json({
        message: "Failed to upload image to cloudinary",
        success: false,
      });
    }

    // Delete local file after successful cloudinary upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Create new hero image record with cloudinary URL
    const heroImage = new heroImageModel({
      image: cloudinaryResponse.url,
      userId: userId,
    });

    await heroImage.save();

    return res.status(201).json({
      message: "Hero image uploaded successfully",
      success: true,
      data: heroImage,
    });
  } catch (error) {
    // Clean up local file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
const createVideo = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an image",
        success: false,
      });
    }

    // Get user ID from authenticated admin
    const userId = req.userId;

    // Upload to cloudinary
    const cloudinaryResponse = await uploadToCloudinary(req.file);

    if (!cloudinaryResponse || !cloudinaryResponse.url) {
      return res.status(500).json({
        message: "Failed to upload image to cloudinary",
        success: false,
      });
    }

    // Delete local file after successful cloudinary upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Create new hero image record with cloudinary URL
    const video = new heroImageModel({
      video: cloudinaryResponse.url,
      userId: userId,
    });

    await video.save();

    return res.status(201).json({
      message: "Hero image uploaded successfully",
      success: true,
      data: video,
    });
  } catch (error) {
    // Clean up local file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getHeroImage = async (req, res) => {
  try {
    // Get all hero images or the latest one
    const heroImages = await heroImageModel
      .find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    if (!heroImages || heroImages.length === 0) {
      return res.status(404).json({
        message: "No hero images found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Hero images fetched successfully",
      success: true,
      data: heroImages,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
const getVideo = async (req, res) => {
  try {
    // Get all hero images or the latest one
    const video = await heroImageModel
      .find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    if (!video?.video) {
      return res.status(404).json({
        message: "No video found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Video fetched successfully",
      success: true,
      data: video?.video,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const deleteHeroImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the hero image
    const heroImage = await heroImageModel.findById(id);

    if (!heroImage) {
      return res.status(404).json({
        message: "Hero image not found",
        success: false,
      });
    }

    // Extract public_id from cloudinary URL for deletion
    const imageUrl = heroImage.image;
    let publicId = null;

    if (imageUrl && imageUrl.includes("cloudinary.com")) {
      // Extract public_id from cloudinary URL
      const urlParts = imageUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        publicId = fileNameWithExtension.split(".")[0]; // Remove file extension
      }
    }

    // Delete from cloudinary if we have public_id
    if (publicId) {
      try {
        // You'll need to import cloudinary's v2 API for deletion
        // import { v2 as cloudinary } from 'cloudinary';
        // await cloudinary.uploader.destroy(publicId);

        // For now, just log the public_id
        console.log("Image public_id to delete from cloudinary:", publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting from cloudinary:", cloudinaryError);
        // Continue with database deletion even if cloudinary deletion fails
      }
    }

    // Delete from database
    await heroImageModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Hero image deleted successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the hero image
    const video = await heroImageModel.findById(id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false,
      });
    }

    // Extract public_id from cloudinary URL for deletion
    const videoUrl = video.video;
    let publicId = null;

    if (videoUrl && videoUrl.includes("cloudinary.com")) {
      // Extract public_id from cloudinary URL
      const urlParts = videoUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        publicId = fileNameWithExtension.split(".")[0]; // Remove file extension
      }
    }

    // Delete from cloudinary if we have public_id
    if (publicId) {
      try {
        // You'll need to import cloudinary's v2 API for deletion
        // import { v2 as cloudinary } from 'cloudinary';
        // await cloudinary.uploader.destroy(publicId);

        // For now, just log the public_id
        console.log("Image public_id to delete from cloudinary:", publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting from cloudinary:", cloudinaryError);
        // Continue with database deletion even if cloudinary deletion fails
      }
    }

    // Delete from database
    await heroImageModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Video deleted successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export {
  createHeroImage,
  getHeroImage,
  deleteHeroImage,
  createVideo,
  getVideo,
  deleteVideo,
};
