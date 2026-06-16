const ProductPost = require("../models/product_post.model");
const User = require("../models/user.model");
const { formatUser, hydrateProducts } = require("../utils/serializers");

const getProductById = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const [formatted] = await hydrateProducts([product]);
    const seller = product.ownerId ? await User.findById(product.ownerId).lean() : null;

    res.json({
      success: true,
      data: {
        ...formatted,
        seller: formatUser(seller),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProductById,
};
