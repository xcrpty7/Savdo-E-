const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Cart = require('../models/Cart.model');
const ApiError = require('../utils/ApiError');

const TAX_RATE = 0.1;
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5;

const createOrder = async (userId, { items, shippingAddress, paymentMethod, notes }) => {
  const resolvedItems = [];
  let itemsPrice = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw new ApiError(404, `Product ${item.product} not found`);
    }

    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true, select: 'name images finalPrice' }
    );
    if (!updated) {
      throw new ApiError(400, `Insufficient stock for "${product.name}"`);
    }

    resolvedItems.push({
      product: product._id,
      name: updated.name,
      image: updated.images[0]?.url || '',
      price: updated.finalPrice,
      quantity: item.quantity,
    });

    itemsPrice += updated.finalPrice * item.quantity;
  }

  const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxPrice = Math.round(itemsPrice * TAX_RATE * 100) / 100;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  const order = await Order.create({
    user: userId,
    items: resolvedItems,
    shippingAddress,
    paymentMethod,
    notes,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // Clear cart after successful order
  await Cart.findOneAndUpdate({ user: userId }, { items: [], totalItems: 0, totalPrice: 0 });

  return order;
};

const getUserOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('items.product', 'name images'),
    Order.countDocuments({ user: userId }),
  ]);

  return { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

const getOrderById = async (orderId, userId, role) => {
  const query = { _id: orderId };
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    query.user = userId;
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email')
    .populate('items.product', 'name images');

  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

const updateOrderStatus = async (orderId, { orderStatus, paymentStatus }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (orderStatus) {
    order.orderStatus = orderStatus;
    if (orderStatus === 'delivered') order.deliveredAt = new Date();
    if (orderStatus === 'paid') order.paidAt = new Date();
  }
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') order.paidAt = new Date();
  }

  await order.save();
  return order;
};

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new ApiError(404, 'Order not found');

  if (['shipped', 'delivered'].includes(order.orderStatus)) {
    throw new ApiError(400, 'Cannot cancel an order that has been shipped or delivered');
  }

  order.orderStatus = 'cancelled';
  await order.save();

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  return order;
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
