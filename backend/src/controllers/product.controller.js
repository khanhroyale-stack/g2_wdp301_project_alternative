const ProductPost = require("../models/product_post.model");
const ProductImage = require("../models/product_image.model");
const Category = require("../models/category.model");
const User = require("../models/user.model");

/**
 * @desc    Get all approved products for marketplace
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      type, 
      minPrice, 
      maxPrice, 
      condition, 
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { postStatus: "approved" };

    if (category) filter.categoryId = category;
    if (type) filter.productType = type;
    if (condition) filter.conditionStatus = condition;
    
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const products = await ProductPost.find(filter)
      .populate("ownerId", "fullName email avatarUrl")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get images for each product
    for (let product of products) {
      const images = await ProductImage.find({ productPostId: product._id })
        .select("imageUrl displayOrder")
        .sort({ displayOrder: 1 })
        .lean();
      product.images = images.map(img => img.imageUrl);
    }

    const total = await ProductPost.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id)
      .populate("ownerId", "fullName email phone avatarUrl address reputationScore")
      .populate("categoryId", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    // Get images
    const images = await ProductImage.find({ productPostId: product._id })
      .select("imageUrl displayOrder")
      .sort({ displayOrder: 1 })
      .lean();
    product.images = images.map(img => img.imageUrl);

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/products/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories
};
