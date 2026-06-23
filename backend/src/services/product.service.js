const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');

const getProducts = async (userId, queryParams = {}) => {
  const { search, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = queryParams;

  const filter = { owner: userId };
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortBy === 'name' ? 'name' : 'createdAt']: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .select('-reviews'),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    limit: Number(limit),
  };
};

const getProductBySlug = async (slug, userId) => {
  const filter = { slug };
  if (userId) filter.owner = userId;
  const product = await Product.findOne(filter).populate('reviews.user', 'name avatar');
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const getProductById = async (id, userId) => {
  const filter = { _id: id };
  if (userId) filter.owner = userId;
  const product = await Product.findOne(filter).populate('reviews.user', 'name avatar');
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const createProduct = async (productData, userId) => {
  const product = await Product.create({
    ...productData,
    owner: userId,
    createdBy: userId,
  });
  return product;
};

const updateProduct = async (id, userId, updateData) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, owner: userId },
    updateData,
    { new: true, runValidators: true }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const deleteProduct = async (id, userId) => {
  const product = await Product.findOneAndDelete({ _id: id, owner: userId });
  if (!product) throw new ApiError(404, 'Product not found');
  return { message: "Mahsulot o'chirildi" };
};

const addReview = async (productId, userId, userName, { rating, comment }) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existingReview = product.reviews.find(
    (r) => r.user.toString() === userId.toString()
  );
  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this product');
  }

  product.reviews.push({ user: userId, name: userName, rating, comment });
  product.calcAverageRating();
  await product.save();
  return product;
};

const getCategories = async (userId) => {
  const categories = await Product.distinct('category', { owner: userId });
  return categories.filter(Boolean).sort();
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
};
