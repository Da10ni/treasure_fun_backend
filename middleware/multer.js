// =============================================
// 4. MULTER MIDDLEWARE (middleware/uploadMiddleware.js)
// =============================================

import multer from 'multer';

// Configure multer for memory storage (buffer)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow only image files and PDFs
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, JPG and PDF files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Export the middleware
const uploadDepositFile = upload.single('attachment');

// Wrapper function for better error handling
const uploadMiddleware = (req, res, next) => {
  uploadDepositFile(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File size too large. Maximum 5MB allowed.',
          success: false
        });
      }
      return res.status(400).json({
        message: err.message,
        success: false
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message,
        success: false
      });
    }
    next();
  });
};

export default uploadMiddleware;