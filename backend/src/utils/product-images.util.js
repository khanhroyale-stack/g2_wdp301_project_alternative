const ProductImage = require("../models/product_image.model");

const extractMediaUrl = (image) => {
  const media = image.mediaId || image.field;
  return media?.publicUrl || null;
};

const getImageQuery = (postIds) => ({
  postId: Array.isArray(postIds) ? { $in: postIds } : postIds,
});

const fetchImages = async (postIds) => {
  if (Array.isArray(postIds) && postIds.length === 0) {
    return [];
  }

  return ProductImage.find(getImageQuery(postIds))
    .populate("mediaId", "publicUrl")
    .populate("field", "publicUrl")
    .sort({ isThumbnail: -1, sortOrder: 1, createdAt: 1 })
    .lean();
};

const getProductImageUrls = async (postId) => {
  const images = await fetchImages(postId);
  return images.map(extractMediaUrl).filter(Boolean);
};

const getProductThumbnailUrl = async (postId) => {
  const images = await fetchImages(postId);
  return images.map(extractMediaUrl).find(Boolean) || null;
};

const attachImagesToProducts = async (products) => {
  if (!products?.length) {
    return products || [];
  }

  const ids = products.map((product) => String(product._id));
  const images = await fetchImages(ids);
  const grouped = new Map();

  for (const image of images) {
    const key = String(image.postId);
    const publicUrl = extractMediaUrl(image);

    if (!publicUrl) {
      continue;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(publicUrl);
  }

  return products.map((product) => {
    const productId = String(product._id);
    const imageUrls = grouped.get(productId) || [];
    product.images = imageUrls;
    product.thumbnailUrl = imageUrls[0] || null;
    return product;
  });
};

module.exports = {
  attachImagesToProducts,
  getProductImageUrls,
  getProductThumbnailUrl,
};
