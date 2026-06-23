const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }
};

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Products retrieved'));
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug, req.user._id);
  res.status(200).json(new ApiResponse(200, { product }, 'Product retrieved'));
});

const getProductById = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const product = await productService.getProductById(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, { product }, 'Product retrieved'));
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, { product }, 'Product created'));
});

const updateProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const product = await productService.updateProduct(req.params.id, req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { product }, 'Product updated'));
});

const deleteProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const result = await productService.deleteProduct(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const addReview = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const product = await productService.addReview(
    req.params.id,
    req.user._id,
    req.user.name,
    req.body
  );
  res.status(201).json(new ApiResponse(201, { product }, 'Review added'));
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getCategories(req.user._id);
  res.status(200).json(new ApiResponse(200, { categories }, 'Categories retrieved'));
});

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
