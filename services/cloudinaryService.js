// =============================================
// 5. CLOUDINARY SERVICE (services/cloudinaryService.js)
// =============================================

import cloudinary from '../methods/cloudinary.js';
import getDataUri from '../methods/dataUriParser.js';

// Upload file to Cloudinary
export const uploadToCloudinary = async (file, folder = 'deposits') => {
  try {
    const dataUri = getDataUri(file);
    
    const result = await cloudinary.uploader.upload(dataUri.content, {
      folder: folder,
      resource_type: 'auto', // Automatically detect file type
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Get optimized image URL
export const getOptimizedImageUrl = (public_id, options = {}) => {
  try {
    const {
      width = 400,
      height = 300,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;
    
    return cloudinary.url(public_id, {
      width,
      height,
      crop,
      quality,
      format
    });
  } catch (error) {
    throw new Error(`URL generation failed: ${error.message}`);
  }
};