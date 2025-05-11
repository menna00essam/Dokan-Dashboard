const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer storage with dynamic folder
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log("Inside CloudinaryStorage params");
    let folderName = "default";

    if (req.folderName) {
      folderName = req.folderName;
    }
    console.log("Folder name:", folderName);
    console.log("File:", file);

    return {
      folder: folderName || "general",
      allowed_formats: ["jpg", "png", "jpeg"],
    };
  },
});

const upload = multer({ storage });
console.log("Multer upload object created");

module.exports = upload;
