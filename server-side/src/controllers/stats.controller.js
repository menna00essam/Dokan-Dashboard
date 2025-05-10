const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const formatOrders = require("../utils/formatOrders");
const httpStatusText = require("../utils/httpStatusText");

const getTotalRevenue = async (req, res) => {
  const result = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  res.json({ totalRevenue: result[0]?.total || 0 });
};

const getOrderCount = async (req, res) => {
  console.log("GET /dashboard/stats/orders hit");

  const count = await Order.countDocuments();
  res.json({ orderCount: count });
};

const getAvgOrderValue = async (req, res) => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
  ]);
  const avg = result[0] ? result[0].total / result[0].count : 0;
  res.json({ avgOrderValue: avg });
};

const getWeeklyStats = async (req, res) => {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const data = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: lastWeek, $lte: today },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%w", date: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
  ]);

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const filledData = allDays.map((day) => {
    const dayData = data.find((d) => d._id === day);
    return {
      day,
      revenue: dayData?.revenue || 0,
      orders: dayData?.orders || 0,
      avgOrderValue:
        dayData?.revenue && dayData?.orders
          ? dayData.revenue / dayData.orders
          : 0,
    };
  });

  res.json(filledData);
};

const getNewlyCustomers = async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
      isActive: true,
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10); // Limit to 10 users

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        users,
        totalUsers: users.length,
      },
    });
  } catch (err) {
    console.error("Error fetching new users:", err);
    res.status(500).json({
      status: httpStatusText.ERROR,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const getNewlyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .populate("userId", "-password -__v")
      .populate("orderItems.productId")
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedOrders = formatOrders(orders);

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { orders: formattedOrders, totalOrders: orders.length },
    });
  } catch (err) {
    console.error("Error fetching new orders:", err);
    res.status(500).json({
      status: httpStatusText.ERROR,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
const getNewlyProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10) // Get only 10 products
      .populate("categories", "name") // Keep category population if needed
      .lean(); // Use lean() for better performance if you don't need Mongoose documents

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        products,
        totalProducts: products.length,
      },
    });
  } catch (err) {
    console.error("Error fetching new products:", err);
    res.status(500).json({
      status: httpStatusText.ERROR,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports = {
  getTotalRevenue,
  getOrderCount,
  getAvgOrderValue,
  getWeeklyStats,
  getNewlyCustomers,
  getNewlyOrders,
  getNewlyProducts,
};
