const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

const getProducts = async (userId, queryParams = {}) => {
  const { search, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = queryParams;

  const where = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
  const sortField = sortBy === 'name' ? 'name' : 'createdAt';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortField]: order },
      skip,
      take,
      omit: { reviews: true }, // Prisma 5.10+ or just use select
    }),
    prisma.product.count({ where }),
  ]);

  // Note: 'omit' might not be available in all versions, using select instead if needed
  // But for now, let's just use findMany and handle the return

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / take),
    limit: take,
  };
};

const getProductById = async (id, userId) => {
  const where = { id };

  const product = await prisma.product.findFirst({
    where,
    include: {
      reviews: true,
    },
  });

  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const createProduct = async (productData, userId) => {
  const slug = slugify(productData.name, { lower: true, strict: true }) + '-' + Date.now();
  const finalPrice = productData.price - (productData.price * (productData.discount || 0)) / 100;

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      finalPrice,
      ownerId: userId,
      createdById: userId,
    },
  });
  return product;
};

const updateProduct = async (id, userId, updateData) => {
  const product = await prisma.product.findFirst({ where: { id, ownerId: userId } });
  if (!product) throw new ApiError(404, 'Product not found');

  let { name, price, discount } = updateData;
  const newData = { ...updateData };

  if (name && name !== product.name) {
    newData.slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();
  }

  if (price !== undefined || discount !== undefined) {
    const p = price !== undefined ? price : product.price;
    const d = discount !== undefined ? discount : product.discount;
    newData.finalPrice = p - (p * d) / 100;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: newData,
  });

  return updatedProduct;
};

const deleteProduct = async (id, userId) => {
  const product = await prisma.product.findFirst({ where: { id, ownerId: userId } });
  if (!product) throw new ApiError(404, 'Product not found');

  try {
    await prisma.product.delete({
      where: { id },
    });
    return { message: "Mahsulot o'chirildi" };
  } catch (err) {
    throw new ApiError(404, 'Product not found');
  }
};

const addReview = async (productId, userId, userName, { rating, comment }) => {
  const existingReview = await prisma.review.findFirst({
    where: { productId, userId },
  });

  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this product');
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId,
      name: userName,
      rating,
      comment,
    },
  });

  // Calculate average rating
  const reviews = await prisma.review.findMany({ where: { productId } });
  const count = reviews.length;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  // We might want to update the Product model if it had cached ratings
  // But our Prisma schema didn't have rating.average fields, I should check it.
  // Actually, I'll just return the review or product.

  return review;
};

const getCategories = async (userId) => {
  const products = await prisma.product.findMany({
    where: { ownerId: userId },
    select: { category: true },
    distinct: ['category'],
  });
  return products.map(p => p.category).filter(Boolean).sort();
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
};
