const wishlistService = require('../services/wishlist.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  res.status(200).json(new ApiResponse(200, { wishlist }, 'Wishlist retrieved'));
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const { action, wishlist } = await wishlistService.toggleWishlist(
    req.user.id,
    req.params.productId
  );
  const message = action === 'added' ? 'Added to wishlist' : 'Removed from wishlist';
  res.status(200).json(new ApiResponse(200, { wishlist, action }, message));
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeFromWishlist(
    req.user.id,
    req.params.productId
  );
  res.status(200).json(new ApiResponse(200, { wishlist }, 'Removed from wishlist'));
});

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
