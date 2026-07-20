const fs = require("fs");
const path = require("path");
const ProductImage = require("../models/product_image.model");

const uploadsRoot = path.resolve(__dirname, "../../uploads");

const normalizeLocalUploadUrl = (url) => {
  if (!url) {
    return null;
  }

  const value = String(url);
  if (value.startsWith("/uploads/")) {
    return value;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//.test(value)) {
    return value.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "");
  }

  return value;
};

const extractMediaUrl = (image) => {
  if (image.imageUrl) {
    return normalizeLocalUploadUrl(image.imageUrl);
  }

  const media = image.mediaId || image.field;
  return normalizeLocalUploadUrl(media?.publicUrl);
};

const isAvailableImageUrl = (url) => {
  if (!url || !url.startsWith("/uploads/")) return Boolean(url);

  const relativePath = url.slice("/uploads/".length).replaceAll("/", path.sep);
  const absolutePath = path.resolve(uploadsRoot, relativePath);
  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) return false;

  return fs.existsSync(absolutePath);
};

const getImageQuery = (postIds) => ({
  $or: [
    { postId: Array.isArray(postIds) ? { $in: postIds } : postIds },
    { productPostId: Array.isArray(postIds) ? { $in: postIds } : postIds },
  ],
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
  return images.map(extractMediaUrl).filter(isAvailableImageUrl);
};

const getProductThumbnailUrl = async (postId) => {
  const images = await fetchImages(postId);
  return images.map(extractMediaUrl).find(isAvailableImageUrl) || null;
};

const attachImagesToProducts = async (products) => {
  if (!products?.length) {
    return products || [];
  }

  const ids = products.map((product) => String(product._id));
  const images = await fetchImages(ids);
  const grouped = new Map();

  for (const image of images) {
    const key = String(image.postId || image.productPostId);
    const publicUrl = extractMediaUrl(image);

    if (!isAvailableImageUrl(publicUrl)) {
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
