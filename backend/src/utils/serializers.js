const Category = require("../models/category.model");
const MediaFile = require("../models/media_file.model");
const ProductImage = require("../models/product_image.model");
const { isUserPro } = require("./business-rules");

const formatUser = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    id: user._id,
    name: user.fullName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || "",
    avatar: user.avatarUrl || "",
    avatarUrl: user.avatarUrl || "",
    address: user.address || "",
    role: user.role,
    verificationStatus: user.verificationStatus,
    reputationScore: user.reputationScore,
    accountStatus: user.accountStatus,
    proExpiresAt: user.proExpiresAt || null,
    isPro: isUserPro(user),
    hasSetupFeaturedProducts: !!user.hasSetupFeaturedProducts,
  };
};

const PRODUCT_TYPE_LABEL = {
  sale: "ban",
  rent: "cho-thue",
  both: "ban",
};

const CONDITION_LABEL = {
  new: "Mới",
  like_new: "Như mới",
  good: "Đã dùng - Còn tốt",
  fair: "Đã dùng - Có lỗi nhỏ",
  poor: "Đã dùng - Cũ",
};

const PRODUCT_STATUS = {
  approved: "AVAILABLE",
  closed: "SOLD",
  pending: "PENDING",
  rejected: "REJECTED",
};

const hydrateProducts = async (products) => {
  const list = Array.isArray(products) ? products : [products];
  const ids = list.map((item) => item?._id).filter(Boolean);

  const [images, categories] = await Promise.all([
    ProductImage.find({ postId: { $in: ids } }).lean(),
    Category.find({ _id: { $in: list.map((item) => item?.categoryId).filter(Boolean) } }).lean(),
  ]);

  const mediaIds = images.map((item) => item.mediaId).filter(Boolean);
  const medias = mediaIds.length ? await MediaFile.find({ _id: { $in: mediaIds } }).lean() : [];

  const mediaMap = new Map(medias.map((item) => [String(item._id), item]));
  const imageMap = new Map();
  const categoryMap = new Map(categories.map((item) => [String(item._id), item]));

  for (const image of images) {
    const key = String(image.postId);
    const media = mediaMap.get(String(image.mediaId));
    if (!imageMap.has(key)) imageMap.set(key, []);
    imageMap.get(key).push({
      url: media?.publicUrl || "",
      sortOrder: image.sortOrder || 0,
      isThumbnail: image.isThumbnail || false,
    });
  }

  return list.map((productDoc) => {
    if (!productDoc) return null;
    const product = productDoc.toObject ? productDoc.toObject() : productDoc;
    const productImages = (imageMap.get(String(product._id)) || [])
      .sort((a, b) => {
        if (a.isThumbnail !== b.isThumbnail) return a.isThumbnail ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      })
      .map((item) => item.url)
      .filter(Boolean);
    const category = categoryMap.get(String(product.categoryId));

    return {
      _id: product._id,
      title: product.title,
      description: product.description,
      listingType: PRODUCT_TYPE_LABEL[product.productType] || "ban",
      productType: product.productType,
      salePrice: product.salePrice || 0,
      rentalPricePerDay: product.rentPricePerDay || 0,
      depositAmount: product.depositAmount || 0,
      location: product.location || "",
      condition: CONDITION_LABEL[product.conditionStatus] || product.conditionStatus,
      status: PRODUCT_STATUS[product.postStatus] || product.postStatus,
      images: productImages,
      category: category ? { _id: category._id, name: category.name } : null,
      averageRating: 0,
      reviewCount: 0,
    };
  });
};

module.exports = {
  formatUser,
  hydrateProducts,
};
