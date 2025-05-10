const mongoose = require("mongoose");
const httpStatusText = require("../utils/httpStatusText");
const AppError = require("../utils/appError");
const Product = require("../models/product.model");
const Image = require("../models/gallary.model");
const asyncWrapper = require("../middlewares/asyncWrapper.middleware");
const cloudinary = require("cloudinary").v2; // Import Cloudinary

// Helper function to calculate effective price
const calculateEffectivePrice = () => ({
  $cond: {
    if: { $gt: ["$sale", 0] },
    then: {
      $multiply: ["$price", { $subtract: [1, { $divide: ["$sale", 100] }] }],
    },
    else: "$price",
  },
});

// Helper functions for aggregations
const projectFields = () => ({
  _id: 1,
  name: 1,
  subtitle: 1,
  price: 1,
  date: 1,
  sale: 1,
  effectivePrice: 1,
});

const lookupCategories = () => ({
  from: "categories",
  localField: "categories",
  foreignField: "_id",
  as: "categories",
});

const projectCategoryNames = () => ({
  _id: 1,
  name: 1,
  subtitle: 1,
  price: 1,
  date: 1,
  sale: 1,
  categories: {
    $map: {
      input: "$categories",
      as: "category",
      in: { _id: "$$category._id", name: "$$category.name" },
    },
  },
});

// Get total products count
const getTotalProducts = async (categoryFilter, priceFilter) => {
  const result = await Product.aggregate([
    { $match: categoryFilter },
    { $addFields: { effectivePrice: calculateEffectivePrice() } },
    { $match: priceFilter },
    { $count: "total" },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Get filtered products
const getFilteredProducts = async (
  categoryFilter,
  priceFilter,
  sortField,
  sortOrder,
  skip,
  limit
) => {
  return await Product.aggregate([
    { $match: categoryFilter },
    { $addFields: { effectivePrice: calculateEffectivePrice() } },
    { $match: priceFilter },
    { $sort: { [sortField]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: lookupCategories(),
    },
    {
      $project: {
        ...projectFields(),
        colors: 1, // Include the colors array
        categories: {
          $map: {
            input: "$categories",
            as: "category",
            in: { _id: "$$category._id", name: "$$category.name" },
          },
        },
      },
    },
  ]);
};

// Get price range
const getPriceRange = async () => {
  const result = await Product.aggregate([
    { $addFields: { effectivePrice: calculateEffectivePrice() } },
    {
      $group: {
        _id: null,
        minPrice: { $min: "$effectivePrice" },
        maxPrice: { $max: "$effectivePrice" },
      },
    },
  ]);
  return result[0] || { minPrice: 0, maxPrice: 0 };
};

// Get all products
const getAllProducts = asyncWrapper(async (req, res, next) => {
  let {
    limit = 16,
    page = 1,
    categories = "",
    order = "desc",
    sortBy = "date",
    minPrice,
    maxPrice,
    search = "", // Add search parameter
  } = req.query;

  limit = Number(limit);
  page = Number(page);
  console.log("Received search query:", search); // At the beginning of your controller
  if (isNaN(limit) || isNaN(page) || limit < 1 || page < 1) {
    return next(
      new AppError("Invalid pagination parameters.", 400, httpStatusText.FAIL)
    );
  }

  const skip = (page - 1) * limit;
  const sortOrder = order === "asc" ? 1 : -1;

  const sortFields = {
    name: "name",
    date: "date",
    price: "effectivePrice",
  };

  const sortField = sortFields[sortBy] || "date";

  // Initialize base filter with isDeleted condition
  let baseFilter = { isDeleted: { $ne: true } };

  // Add category filter if categories are provided
  if (categories) {
    const categoryIds = categories.split(",").map((id) => id.trim());

    if (!categoryIds.every((id) => mongoose.isValidObjectId(id))) {
      return next(
        new AppError("Invalid Category ID format.", 400, httpStatusText.FAIL)
      );
    }

    baseFilter.categories = {
      $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  // Handle price range
  if (!minPrice || !maxPrice) {
    const { minPrice: min, maxPrice: max } = await getPriceRange();
    minPrice = minPrice ?? min;
    maxPrice = maxPrice ?? max;
  }

  minPrice = Number(minPrice);
  maxPrice = Number(maxPrice);

  const priceFilter =
    !isNaN(minPrice) && !isNaN(maxPrice)
      ? { effectivePrice: { $gte: minPrice, $lte: maxPrice } }
      : {};

  if (search && search.trim()) {
    try {
      // Escape special regex characters properly
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      baseFilter.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { "colors.sku": { $regex: searchRegex } },
      ];

      console.log("Applied search filter:", baseFilter.$or); // Debug log
    } catch (err) {
      console.error("Error creating search regex:", err);
      return next(new AppError("Invalid search query", 400));
    }
  }

  const [totalProducts, products] = await Promise.all([
    getTotalProducts({ ...baseFilter }, priceFilter),
    getFilteredProducts(
      { ...baseFilter },
      priceFilter,
      sortField,
      sortOrder,
      skip,
      limit
    ),
  ]);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { totalProducts, products },
  });
});
const createProduct = asyncWrapper(async (req, res, next) => {
  console.log("Received data:", req.body);

  const {
    name,
    subtitle = "",
    price,
    description = "",
    categories,
    brand = "",
    colors,
    additionalInformation = {},
    dimensions = {}, // هيتم استقبالها من req.body
  } = req.body;

  if (
    !name ||
    !price ||
    !categories ||
    !Array.isArray(colors) ||
    colors.length === 0
  ) {
    return next(
      new AppError(
        "Name, price, categories, and colors are required.",
        400,
        httpStatusText.FAIL
      )
    );
  }

  const validatedColors = [];
  for (const colorData of colors) {
    const productImagesIds = [];
    if (colorData.images && Array.isArray(colorData.images)) {
      for (const imageData of colorData.images) {
        const imageDocument = await Image.create({
          publicId: imageData.public_id,
          imageUrl: imageData.url,
          reference: { model: "Product", field: "colors.images" },
        });
        productImagesIds.push(imageDocument._id);
      }
    }

    validatedColors.push({
      name: colorData.name,
      hex: colorData.hex,
      quantity: colorData.quantity,
      sku: colorData.sku,
      images: productImagesIds,
    });
  }

  const product = await Product.create({
    name,
    subtitle,
    price,
    description,
    categories,
    brand,
    colors: validatedColors,
    additionalInformation: additionalInformation,
  });

  res.status(201).json({ status: httpStatusText.SUCCESS, data: { product } });
});
// Get product by ID
const getProductById = asyncWrapper(async (req, res, next) => {
  const { product_id } = req.params;
  if (!product_id) {
    return next(
      new AppError("Product ID is required", 400, httpStatusText.FAIL)
    );
  }
  if (!mongoose.isValidObjectId(product_id)) {
    return next(
      new AppError("Invalid Product ID format", 400, httpStatusText.FAIL)
    );
  }

  const product = await Product.findById(product_id)
    .populate({
      path: "colors.images",
      select: "publicId imageUrl",
    })
    .populate("categories", "name")
    .select(
      "name subtitle price description additionalInformation categories colors totalQuantity"
    )
    .lean();

  if (!product) {
    return next(new AppError("Product not found", 404, httpStatusText.FAIL));
  }

  res.status(200).json({ status: httpStatusText.SUCCESS, data: { product } });
});

const updateProduct = asyncWrapper(async (req, res, next) => {
  const { product_id } = req.params;
  let updateData = {};

  // Parse form data
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.subtitle) updateData.subtitle = req.body.subtitle;
  if (req.body.price) updateData.price = req.body.price;
  if (req.body.discountType) updateData.discountType = req.body.discountType;
  if (req.body.discountValue) updateData.sale = req.body.discountValue;
  if (req.body.quantity) updateData.totalQuantity = req.body.quantity;

  // Handle categories
  if (req.body.categories) {
    updateData.categories = Array.isArray(req.body.categories)
      ? req.body.categories.map((id) => new mongoose.Types.ObjectId(id))
      : [new mongoose.Types.ObjectId(req.body.categories)];
  }

  // Handle dimensions
  if (req.body.dimensions) {
    try {
      updateData.additionalInformation = {
        dimensions: JSON.parse(req.body.dimensions),
      };
    } catch (err) {
      console.error("Error parsing dimensions:", err);
      return next(new AppError("Invalid dimensions data", 400));
    }
  }

  // Handle colors and images
  if (req.body.colors) {
    try {
      const colors = JSON.parse(req.body.colors);

      // First get the current product to compare with existing images
      const currentProduct = await Product.findById(product_id).populate(
        "colors.images"
      );
      const currentColorImages = currentProduct?.colors?.[0]?.images || [];

      updateData.colors = await Promise.all(
        colors.map(async (color, colorIndex) => {
          const images = [];
          const processedPublicIds = new Set();

          // Process each image
          for (const img of color.images) {
            // Skip if we've already processed this public_id
            if (img.public_id && processedPublicIds.has(img.public_id))
              continue;

            // Existing image being updated (with new version)
            if (img._id && img.public_id) {
              const existingImg = await Image.findById(img._id);

              if (!existingImg) {
                console.warn(`Image not found: ${img._id}`);
                continue;
              }

              // Check if this is actually a new upload (public_id changed)
              if (existingImg.publicId !== img.public_id) {
                // Delete old image from Cloudinary if it exists
                if (existingImg.publicId) {
                  try {
                    await cloudinary.uploader.destroy(existingImg.publicId);
                  } catch (err) {
                    console.warn(
                      `Failed to delete old image from Cloudinary: ${existingImg.publicId}`
                    );
                  }
                }

                // Update image document
                existingImg.publicId = img.public_id;
                existingImg.imageUrl = img.url;
                await existingImg.save();
              }

              images.push(existingImg._id);
              processedPublicIds.add(img.public_id);
            }
            // New image (no _id but has public_id)
            else if (img.public_id && !img._id) {
              // Check if this image already exists in the current product
              const isExisting = currentColorImages.some(
                (currentImg) => currentImg.publicId === img.public_id
              );

              if (!isExisting) {
                const newImg = await Image.create({
                  publicId: img.public_id,
                  imageUrl: img.url,
                  reference: {
                    model: "Product",
                    field: "colors.images",
                    documentId: product_id,
                  },
                });
                images.push(newImg._id);
                processedPublicIds.add(img.public_id);
              } else {
                // Find the existing image in current product
                const existingImg = currentColorImages.find(
                  (currentImg) => currentImg.publicId === img.public_id
                );
                if (existingImg) {
                  images.push(existingImg._id);
                  processedPublicIds.add(img.public_id);
                }
              }
            }
            // Existing unchanged image (has _id but no public_id change)
            else if (img._id) {
              const existingImg = await Image.findById(img._id);
              if (existingImg) {
                images.push(existingImg._id);
                if (existingImg.publicId) {
                  processedPublicIds.add(existingImg.publicId);
                }
              }
            }
          }

          return {
            name: color.name,
            hex: color.hex,
            quantity: color.quantity,
            sku: color.sku,
            images: Array.from(new Set(images)), // Ensure no duplicate ObjectIds
          };
        })
      );
    } catch (err) {
      console.error("Error processing colors:", err);
      return next(new AppError("Invalid colors data", 400));
    }
  }

  // Update product
  try {
    const product = await Product.findByIdAndUpdate(product_id, updateData, {
      new: true,
      runValidators: true,
    }).populate("colors.images");

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { product },
    });
  } catch (err) {
    console.error("Update error:", err);
    next(new AppError("Failed to update product", 500));
  }
});

const deleteProductImage = asyncWrapper(async (req, res, next) => {
  const { publicId } = req.params;

  try {
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Delete from database if it exists
    await Image.findOneAndDelete({ publicId });

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Image deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting image:", err);
    next(new AppError("Failed to delete image", 500));
  }
});
// Soft delete product
const softDeleteProduct = asyncWrapper(async (req, res, next) => {
  const product = await Product.findById(req.params.product_id);
  if (!product) {
    return next(new AppError("Product not found.", 404, httpStatusText.FAIL));
  }

  product.isDeleted = true;
  await product.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product soft deleted successfully.",
  });
});

// Get product for comparison
const getProductForComparison = asyncWrapper(async (req, res, next) => {
  const { product_id } = req.params;
  if (!product_id) {
    return next(
      new AppError("Product ID is required", 400, httpStatusText.FAIL)
    );
  }

  if (!mongoose.isValidObjectId(product_id)) {
    return next(
      new AppError("Invalid Product ID format", 400, httpStatusText.FAIL)
    );
  }

  const product = await Product.findById(product_id).lean();

  if (!product) {
    return next(new AppError("Product not found", 404, httpStatusText.FAIL));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      product,
    },
  });
});

// Get search products
const getSearchProducts = asyncWrapper(async (req, res, next) => {
  const { query } = req.query;
  if (!query) {
    return next(
      new AppError("Please enter a search keyword!", 400, httpStatusText.FAIL)
    );
  }

  const categoryIds = await getCategoryIds(query);

  const products = await Product.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { categories: { $in: categoryIds } },
    ],
  }).lean();

  if (!products.length) {
    return next(new AppError("No products found.", 404, httpStatusText.FAIL));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: products,
  });
});

const updateProductColors = asyncWrapper(async (req, res, next) => {
  const { product_id } = req.params;
  const { colors } = req.body;

  if (!product_id || !mongoose.isValidObjectId(product_id)) {
    return next(
      new AppError("Invalid Product ID format", 400, httpStatusText.FAIL)
    );
  }

  if (!Array.isArray(colors) || colors.length === 0) {
    return next(
      new AppError("Colors must be a non-empty array", 400, httpStatusText.FAIL)
    );
  }
  // Validate that each color object has the required properties
  for (const color of colors) {
    if (
      !color.name ||
      !color.hex ||
      !Array.isArray(color.images) ||
      color.images.length === 0 ||
      color.quantity === undefined
    ) {
      return next(
        new AppError(
          "Each color must have a name, hex, at least one image and quantity.",
          400,
          httpStatusText.FAIL
        )
      );
    }
  }

  const product = await Product.findById(product_id);
  if (!product) {
    return next(new AppError("Product not found", 404, httpStatusText.FAIL));
  }

  product.colors = colors;
  await product.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product colors updated successfully",
    data: { product },
  });
});

// Get product stock quantity
const getProductStock = asyncWrapper(async (req, res, next) => {
  const { product_id } = req.params;

  if (!product_id) {
    return next(
      new AppError("Product ID is required", 400, httpStatusText.FAIL)
    );
  }

  if (!mongoose.isValidObjectId(product_id)) {
    return next(
      new AppError("Invalid Product ID format", 400, httpStatusText.FAIL)
    );
  }

  const product = await Product.findById(product_id)
    .select("name colors")
    .lean();

  if (!product) {
    return next(new AppError("Product not found", 404, httpStatusText.FAIL));
  }

  const stockData = product.colors.map((color) => ({
    color: color.name,
    quantity: color.quantity,
  }));

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { productName: product.name, stock: stockData },
  });
});

async function getCategoryIds(query) {
  const categories = await require("../models/category.model")
    .find({ name: { $regex: query, $options: "i" } })
    .select("_id")
    .lean();
  return categories.map((cat) => cat._id);
}

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  softDeleteProduct,
  getPriceRange,
  getTotalProducts,
  getFilteredProducts,
  getProductForComparison,
  getSearchProducts,
  updateProductColors,
  getProductStock,
  deleteProductImage,
};
