// =============================================
// 4. MULTER MIDDLEWARE (middleware/uploadMiddleware.js)
// =============================================

import multer from "multer";

// Configure multer for memory storage (buffer)
const storage = multer.memoryStorage();

// Configure multer
export const upload = multer({
  storage,
});

// Export the middleware
const uploadDepositFile = upload.single("attachment");

// Wrapper function for better error handling
const uploadMiddleware = (req, res, next) => {
  uploadDepositFile(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File size too large. Maximum 5MB allowed.",
          success: false,
        });
      }
      return res.status(400).json({
        message: err.message,
        success: false,
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message,
        success: false,
      });
    }
    next();
  });
};

export default uploadMiddleware;
