
const cloudinary = require('cloudinary').v2; // ممكن تحتاجها لو بتعمل عمليات مباشرة هنا
const Image = require('../models/gallary.model');
const { cloudinaryUploadImage } = require('../config/cloudinary.config'); // استورد الـ Function بس


const uploadImage = async (req, res, next) => {
    console.log("Reached uploadImage controller");
  
    try {
      console.log("req.files:", req.files); // هيكون array من الملفات دلوقتي
  
      if (!req.files || req.files.length === 0) {
        return res.status(400).send({ message: "No files uploaded." });
      }
  
      const uploadedImages = [];
  
      for (const file of req.files) {
        console.log("Processing file:", file);
        const result = await cloudinaryUploadImage(
          file.path,
          req.params.folder
        );
        console.log("Cloudinary upload result:", result);
  
        const imageDoc = await Image.create({
          publicId: result.public_id,
          imageUrl: result.secure_url,
        });
        console.log("Image document created:", imageDoc);
        uploadedImages.push({ publicId: imageDoc.publicId, imageUrl: imageDoc.imageUrl });
      }
  
      res.status(201).send({
        message: "Successfully uploaded images",
        data: uploadedImages,
      });
  
    } catch (err) {
      console.error("Error in uploadImage:", err);
      next(err);
    }
  };
const updateImagesInDatabase = async () => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 100,
        });

        const images = result.resources.map((img) => ({
            public_id: img.public_id,
            url: img.secure_url,
        }));

        for (const image of images) {
            try {
                await Image.updateOne(
                    { public_id: image.public_id },
                    { $set: image },
                    { upsert: true }
                );
            } catch (err) {
                console.error(
                    `Error in updating or inserting image ${image.public_id}:`,
                    err
                );
            }
        }
        return images;
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
};

const updatedImages = async (req, res) => {
    try {
        const images = await updateImagesInDatabase();
        res.status(201).json({ message: 'Images updated', images });
    } catch (error) {
        console.error('Error updating images:', error);
        res.status(500).json({ error: 'Failed to update images' });
    }
};

const getImages = async (req, res) => {
    try {
        const { product, color } = req.query;

        if (!product || !color) {
            return res.status(400).json({ error: 'Product and color are required' });
        }

        const allImages = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500,
        });

        const filterImages = allImages.resources.filter((img) => {
            const splitPAth = img.public_id.split('/');
            return (
                splitPAth.length >= 4 &&
                splitPAth[splitPAth.length - 3].toLowerCase() ===
                    product.toLowerCase() &&
                splitPAth[splitPAth.length - 2].toLowerCase() === color.toLowerCase()
            );
        });

        const images = filterImages.map((img) => ({
            public_id: img.public_id,
            url: img.secure_url,
        }));

        res.json({ images });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
};
// Asmaa
const getImageById = async (req, res, next) => {
    try {
      const { imageId } = req.params;
      console.log('Received imageId:', imageId);
  
      // ابحث عن الصورة في قاعدة البيانات باستخدام الـ ID
      const image = await Image.findById(imageId);
  
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
  
      // إذا لاقينا الصورة، نرجع الـ imageUrl بتاعها
      res.status(200).json({ imageUrl: image.imageUrl });
  
    } catch (error) {
      console.error('Error fetching image by ID:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  };
  const getImageUrlsByIds = async (imageIds) => {
  const images = await Promise.all(
    imageIds.map(async (id) => {
      const image = await Image.findById(id);
      return image?.imageUrl || "https://via.placeholder.com/150";
    })
  );
  return images;
};
  module.exports = { uploadImage, updatedImages, getImages, getImageById ,getImageUrlsByIds};

