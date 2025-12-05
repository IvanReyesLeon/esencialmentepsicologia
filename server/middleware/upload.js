const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories
const terapeutasDir = path.join(__dirname, '../../client/public/assets/terapeutas');
const talleresDir = path.join(__dirname, '../../client/public/assets/talleres');

// Ensure directories exist
[terapeutasDir, talleresDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use talleres directory for workshop images
    if (req.originalUrl.includes('/workshops')) {
      cb(null, talleresDir);
    } else {
      cb(null, terapeutasDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
