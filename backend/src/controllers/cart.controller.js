const cartService = require('../services/cart.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.status(200).json(new ApiResponse(200, { cart }, 'Cart retrieved'));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const cart = await cartService.addToCart(req.user.id, productId, Number(quantity));
  res.status(200).json(new ApiResponse(200, { cart }, 'Item added to cart'));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await cartService.removeFromCart(req.user.id, req.params.productId);
  res.status(200).json(new ApiResponse(200, { cart }, 'Item removed from cart'));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(
    req.user.id,
    req.params.productId,
    Number(quantity)
  );
  res.status(200).json(new ApiResponse(200, { cart }, 'Cart item updated'));
});

const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.id);
  res.status(200).json(new ApiResponse(200, null, 'Cart cleared'));
});

module.exports = { getCart, addToCart, removeFromCart, updateCartItem, clearCart };
