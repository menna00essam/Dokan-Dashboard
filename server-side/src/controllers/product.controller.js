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
  } = req.query;

  limit = Number(limit);
  page = Number(page);

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

  let categoryFilter = {};
  if (categories) {
    const categoryIds = categories.split(",").map((id) => id.trim());

    if (!categoryIds.every((id) => mongoose.isValidObjectId(id))) {
      return next(
        new AppError("Invalid Category ID format.", 400, httpStatusText.FAIL)
      );
    }

    categoryFilter = {
      categories: {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };
  }
  const isDeletedFilter = { isDeleted: { $ne: true } }; // هنا بنضيف الفلتر

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

  const [totalProducts, products] = await Promise.all([
    getTotalProducts({ ...categoryFilter, ...isDeletedFilter }, priceFilter),
    getFilteredProducts(
      { ...categoryFilter, ...isDeletedFilter },
      priceFilter,
      sortField,
      sortOrder,
      skip,
      limit
    ),
  ]);

  await Product.populate(products, {
    path: 'colors.images',
    model: 'Image'
  });
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { totalProducts, products },
  });
});
//Create product

/*
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
  } = req.body;

  let imageUrl = "";

  if (!name && !price) {
    return next(
      new AppError(
        "At least one of the fields: name, price, or categories must be provided.",
        400,
        httpStatusText.FAIL
      )
    );
  }

  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      return next(
        new AppError(
          "Error uploading image to Cloudinary",
          500,
          httpStatusText.FAIL
        )
      );
    }
  }

  const product = await Product.create({
    name,
    subtitle,
    price,
    description,
    categories,
    brand,
    colors,
    additionalInformation,
    image: imageUrl,
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { product },
  });
});
*/
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
// Update product
// const updateProduct = asyncWrapper(async (req, res, next) => {
//   const { product_id } = req.params;
//   const {
//     name,
//     subtitle,
//     price,
//     description,
//     categories,
//     brand,
//     colors,
//     additionalInformation,
//   } = req.body;

//   const updateData = {};
//   if (name) updateData.name = name;
//   if (subtitle) updateData.subtitle = subtitle;
//   if (price) updateData.price = price;
//   if (description) updateData.description = description;
//   if (categories) updateData.categories = categories;
//   if (brand) updateData.brand = brand;
//   if (colors) {
//     // Validate that each color object has the required properties, and upload images
//     const validatedColors = [];
//     for (const color of colors) {
//       if (
//         !color.name ||
//         !color.hex ||
//         !Array.isArray(color.images) ||
//         color.images.length === 0 ||
//         color.quantity === undefined
//       ) {
//         return next(
//           new AppError(
//             "Each color must have a name, hex, at least one image and quantity.",
//             400,
//             httpStatusText.FAIL
//           )
//         );
//       }

//       const uploadedImages = [];
//       for (const image of color.images) {
//         if (typeof image === "string") {
//           uploadedImages.push({ url: image });
//         } else if (image.path) {
//           // Check if it's a file path from multer
//           try {
//             const result = await cloudinary.uploader.upload(image.path);
//             uploadedImages.push({
//               public_id: result.public_id,
//               url: result.secure_url,
//             });
//           } catch (error) {
//             console.error("Error uploading image to Cloudinary:", error);
//             return next(
//               new AppError(
//                 "Error uploading images to Cloudinary",
//                 500,
//                 httpStatusText.FAIL
//               )
//             );
//           }
//         } else {
//           return next(
//             new AppError(
//               "Image must be either a URL or a file path",
//               500,
//               httpStatusText.FAIL
//             )
//           );
//         }
//       }
//       validatedColors.push({ ...color, images: uploadedImages });
//     }
//     updateData.colors = validatedColors;
//   }
//   if (additionalInformation)
//     updateData.additionalInformation = additionalInformation;

//   const product = await Product.findByIdAndUpdate(product_id, updateData, {
//     new: true,
//   });
//   if (!product) {
//     return next(new AppError("Product not found.", 404, httpStatusText.FAIL));
//   }
//   res.status(200).json({ status: httpStatusText.SUCCESS, data: { product } });
// });
// Update product
// Update product
const updateProduct = asyncWrapper(async (req, res, next) => {
  const { product_id } = req.params;
  let updateData = {};

  // Parse form data
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.subtitle) updateData.subtitle = req.body.subtitle;
  if (req.body.price) updateData.price = req.body.price;

  // Handle categories
  if (req.body.categories) {
    updateData.categories = Array.isArray(req.body.categories)
      ? req.body.categories.map((id) => new mongoose.Types.ObjectId(id))
      : [new mongoose.Types.ObjectId(req.body.categories)];
  }

  // Handle colors and images
  if (req.body.colors) {
    try {
      const colors = JSON.parse(req.body.colors);
      updateData.colors = await Promise.all(
        colors.map(async (color) => {
          const images = [];

          for (const img of color.images) {
            // Existing image being updated
            if (img._id && img._oldPublicId) {
              // Delete old image from Cloudinary
              await cloudinary.uploader.destroy(img._oldPublicId);

              // Update image document
              const updatedImg = await Image.findByIdAndUpdate(
                img._id,
                {
                  publicId: img.public_id,
                  imageUrl: img.url,
                },
                { new: true }
              );

              images.push(updatedImg._id);
            }
            // New image
            else if (img.public_id && !img._id) {
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
            }
            // Existing unchanged image
            else if (img._id) {
              images.push(new mongoose.Types.ObjectId(img._id));
            }
          }

          return {
            name: color.name,
            hex: color.hex,
            quantity: color.quantity,
            sku: color.sku,
            images: images,
          };
        })
      );
    } catch (err) {
      console.error("Error processing colors:", err);
      return next(new AppError("Invalid colors data", 400));
    }
  }

  // Handle dimensions
  if (req.body.dimensions) {
    updateData.additionalInformation = {
      dimensions: JSON.parse(req.body.dimensions),
    };
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
};
