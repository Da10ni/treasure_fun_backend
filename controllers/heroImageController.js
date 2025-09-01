import fs from "fs";
import { heroImageModel } from "../models/HeroImage.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService.js";

const createHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an image",
        success: false,
      });
    }

    const userId = req.userId;
    // Upload to cloudinary using your service (folder: 'hero-media')
    const cloudinaryResponse = await uploadToCloudinary(req.file, 'hero-media');

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

    // Create new hero image record with only image field
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

const getHeroImage = async (req, res) => {
  try {
    // Get all hero images (where image field exists)
    const heroImages = await heroImageModel
      .find({ 
        image: { $exists: true, $ne: null }
      })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

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

const deleteHeroImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the hero image
    const heroImage = await heroImageModel.findById(id);

    if (!heroImage || !heroImage.image) {
      return res.status(404).json({
        message: "Hero image not found",
        success: false,
      });
    }

    // Extract public_id from cloudinary URL for deletion
    const imageUrl = heroImage.image;
    let publicId = null;

    if (imageUrl && imageUrl.includes("cloudinary.com")) {
      const urlParts = imageUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        publicId = fileNameWithExtension.split(".")[0];
      }
    }

    // Delete from cloudinary using your service
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
        console.log("Image deleted from cloudinary:", publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting from cloudinary:", cloudinaryError);
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

const createVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a video file",
        success: false,
      });
    }

    const userId = req.userId;

    // CHANGE 1: Check if any video already exists (single video policy)
    const existingVideo = await heroImageModel.findOne({ 
      video: { $exists: true, $ne: null }
    });

    let wasReplacement = false;

    // CHANGE 2: Delete existing video if found
    if (existingVideo) {
      wasReplacement = true;
      
      // Extract public_id for cloudinary deletion
      const videoUrl = existingVideo.video;
      if (videoUrl && videoUrl.includes("cloudinary.com")) {
        const urlParts = videoUrl.split("/");
        const uploadIndex = urlParts.indexOf("upload");
        if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
          const fileNameWithExtension = urlParts[urlParts.length - 1];
          const publicId = fileNameWithExtension.split(".")[0];
          
          // Delete old video using your cloudinary service
          try {
            await deleteFromCloudinary(publicId);
            console.log("Old video deleted from cloudinary:", publicId);
          } catch (cloudinaryError) {
            console.error("Error deleting old video from cloudinary:", cloudinaryError);
          }
        }
      }
      
      // Delete old video from database
      await heroImageModel.findByIdAndDelete(existingVideo._id);
    }

    // Upload to cloudinary using your service (folder: 'hero-media')
    const cloudinaryResponse = await uploadToCloudinary(req.file, 'hero-media');

    if (!cloudinaryResponse || !cloudinaryResponse.url) {
      return res.status(500).json({
        message: "Failed to upload video to cloudinary",
        success: false,
      });
    }

    // Delete local file after successful upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // CHANGE 3: Create new video record with only video field
    const video = new heroImageModel({
      video: cloudinaryResponse.url,
      userId: userId,
    });

    await video.save();

    return res.status(201).json({
      message: wasReplacement ? "Hero video replaced successfully" : "Hero video uploaded successfully",
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

const getVideo = async (req, res) => {
  try {
    // CHANGE 4: Get video records (where video field exists)
    const videos = await heroImageModel
      .find({ 
        video: { $exists: true, $ne: null }
      })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Hero videos fetched successfully",
      success: true,
      data: videos, // Return as array (frontend expects array format)
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

    // Find the video record
    const video = await heroImageModel.findById(id);

    if (!video || !video.video) {
      return res.status(404).json({
        message: "Hero video not found",
        success: false,
      });
    }

    // Extract public_id from cloudinary URL for deletion
    const videoUrl = video.video;
    let publicId = null;

    if (videoUrl && videoUrl.includes("cloudinary.com")) {
      const urlParts = videoUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        publicId = fileNameWithExtension.split(".")[0];
      }
    }

    // Delete from cloudinary using your service
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
        console.log("Video deleted from cloudinary:", publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting video from cloudinary:", cloudinaryError);
      }
    }

    // Delete from database
    await heroImageModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Hero video deleted successfully",
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
