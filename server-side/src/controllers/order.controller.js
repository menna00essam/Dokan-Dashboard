const asyncWrapper = require("../middlewares/asyncWrapper.middleware");
const httpStatusText = require("../utils/httpStatusText");
const AppError = require("../utils/appError");
const Order = require("../models/order.model");
const orderModel = require("../models/order.model");
const formatOrders = require("../utils/formatOrders");

const createOrder = asyncWrapper(async (req, res, next) => {
  const { userId, orderItems, shippingMethod } = req.body;

  if (!userId || !orderItems || !shippingMethod.name) {
    return next(new AppError("Missing required order fields", 400));
  }

  const newOrder = await Order.create({
    ...req.body,
  });

  res.status(201).json({
    status: "success",
    data: newOrder,
  });
});

const getOrders = asyncWrapper(async (req, res, next) => {
  try {
    console.log('[DEBUG] Incoming Order Body:', req.body);

    let { limit = 10, page = 1, search = "", status = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

    limit = Math.max(1, parseInt(limit));
    page = Math.max(1, parseInt(page));

    const query = { isDeleted: false };

    if (status && status !== 'All') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("userId", "-password -__v")
      .populate("orderItems.productId")
      .populate("orderItems.productId.colors")
      .populate("orderItems.productId.colors.images");

    let filteredOrders = orders;
    if (search.trim() !== "") {
      const regex = new RegExp(search, "i");
      filteredOrders = orders.filter(order =>
        regex.test(order.userId?.firstName) ||
        regex.test(order.userId?.lastName) ||
        regex.test(order.orderNumber) ||
        regex.test(order.status)
      );
    }

    filteredOrders.sort((a, b) => {
      let valA, valB;

      if (sortBy === "userName") {
        valA = a.userId?.firstName?.toLowerCase() || "";
        valB = b.userId?.firstName?.toLowerCase() || "";
      } else if (sortBy === "totalPrice") {
        valA = a.total || 0;
        valB = b.total || 0;
      } else if (sortBy === "createdAt") {
        valA = new Date(a.createdAt);
        valB = new Date(b.createdAt);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalOrders = filteredOrders.length;

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedOrders = filteredOrders.slice(start, end);

    const formattedOrders = await formatOrders(paginatedOrders);

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { orders: formattedOrders, totalOrders },
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

const updateOrderStatus = asyncWrapper(async (req, res, next) => {
  const orderId = req.params.id;
  console.log(orderId)
  const { status } = req.body;

  if (!status) {
    return next(
      new AppError('Status is required', 400, httpStatusText.FAIL)
    );
  }

  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      return next(
        new AppError('Order not found', 404, httpStatusText.FAIL)
      );
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return next(new AppError('Failed to update order status', 500, httpStatusText.ERROR));
  }
});

const softDeleteOrder = asyncWrapper(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await orderModel.findById(orderId);

  if (!order) {
    return next(
      new AppError("Order not found", 404)
    )
  }

  await orderModel.findByIdAndUpdate(
    orderId,
    {
      isDeleted: true,
      previousStatus: order.status,
      status: "Cancelled",
    },
    { new: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Order soft deleted successfully"
  })
})

const restoreOrder = asyncWrapper(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await orderModel.findById(orderId);

  if (!order) {
    return next(
      new AppError('Order not found', 404)
    )
  }

  await orderModel.findByIdAndUpdate(
    orderId,
    {
      isDeleted: false,
      status: order.previousStatus || 'Pending',
      previousStatus: ''
    }
  );

  res.status(200).json({
    status: 'Success',
    message: 'Order restored successfully'
  })
})

const getUserOrders = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  const orders = await Order.find({ userId, isDeleted: false })
    .populate("orderItems.productId")
    .sort({ createdAt: -1 });

  const totalOrders = orders.length;

  const formattedOrders = formatOrders(orders);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    total: totalOrders,
    data: formattedOrders,
  });
});




module.exports = { createOrder, getOrders, updateOrderStatus, softDeleteOrder, restoreOrder,getUserOrders };