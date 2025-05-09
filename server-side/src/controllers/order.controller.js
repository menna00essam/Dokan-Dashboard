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

    let { limit = 10, page = 1, search = "" } = req.query;

    limit = Math.max(1, limit);
    page = Math.max(1, page);

    const skip = (page - 1) * limit;
    const query = {};

    if (isNaN(limit) || isNaN(page)) {
      return next(
        new AppError(
          "Invalid pagination parameters. 'limit' and 'page' must be positive numbers.",
          400,
          httpStatusText.FAIL
        )
      );
    }

    if (search.trim() !== "") {
      const regex = new RegExp(search, "i");
      query.$or = [
        { "user.firstName": regex },
        { "user.lastName": regex },
        { orderNumber: regex },
        { status: regex },
      ];
    }
    console.log(query);


    const orders = await Order.find({ isDeleted: false, ...query })
      .populate("userId", "-password -__v")
      .populate("orderItems.productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ isDeleted: false });

    const formattedOrders = formatOrders(orders);

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

module.exports = { createOrder, getOrders, updateOrderStatus, softDeleteOrder, restoreOrder };

