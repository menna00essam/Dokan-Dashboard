const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const formatOrders = require("../utils/formatOrders");
const httpStatusText = require("../utils/httpStatusText");

// const getTotalRevenue = async (req, res) => {
//  const result = await Order.aggregate([
//    {
//      $addFields: {
//        totalAsNumber: { $toDouble: "$total" },
//      },
//    },
//    {
//      $group: {
//        _id: null,
//        total: { $sum: "$totalAsNumber" },
//      },
//    },
//  ]);

//  res.json({ totalRevenue: result[0]?.total || 0 });
// };

const getTotalRevenue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: {
          totalAsNumber: { $toDouble: "$totalAmount" }, // تحويل إلى رقم
        },
      },
      {
        $match: {
          // ممكن تحدد هنا status أو أي فلترة تانية لو محتاج
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAsNumber" },
        },
      },
    ]);

    console.log("Aggregation Result:", result); // طباعة النتيجة النهائية
    console.log("Is the total revenue 0?", result[0]?.total === 0); // تحقق إذا كانت القيمة 0

    if (result.length > 0 && result[0].total > 0) {
      const totalRevenue = result[0].total;
      console.log("Total Revenue:", totalRevenue); // طباعة totalRevenue في الـ console
      res.json({ totalRevenue: totalRevenue });
    } else {
      console.log("No valid total revenue found."); // إذا ما فيه قيمة صحيحة
      res.json({ totalRevenue: 0 });
    }
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
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

  const roundedAvg = parseFloat(avg.toFixed(2)); // تقريب الناتج إلى رقمين بعد العلامة العشرية

  res.json({ avgOrderValue: roundedAvg });
};

const getWeeklyStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const lastWeek = new Date(startOfToday);
    lastWeek.setDate(startOfToday.getDate() - 6);

    console.log("Last Week Start:", lastWeek);
    console.log("Today End:", startOfToday);

    const data = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek, $lte: new Date() },
        },
      },
      {
        $addFields: {
          totalAsNumber: { $toDouble: "$totalAmount" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%w", date: "$createdAt" }, // يوم الأسبوع (0 للأحد)
          },
          revenue: { $sum: "$totalAsNumber" },
          orders: { $sum: 1 },
        },
      },
    ]);

    // خريطة لتحويل رقم اليوم إلى اختصارات الأيام
    const weekDaysMap = {
      0: "Sun",
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
    };

    const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // ملء البيانات الناقصة بـ 0
    const filledData = allDays.map((day) => {
      const dayKey = Object.keys(weekDaysMap).find(
        (key) => weekDaysMap[key] === day
      );
      const dayData = data.find((d) => d._id === dayKey);
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
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const getNewlyCustomers = async (req, res) => {
//   try {
//     const users = await User.find({
//       role: "user",
//       state: true,
//     })
//       .sort({ createdAt: -1 }) // Sort by newest first
//       .limit(10); // Limit to 10 users

//     res.status(200).json({
//       status: httpStatusText.SUCCESS,
//       data: {
//         users,
//         totalUsers: users.length,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching new users:", err);
//     res.status(500).json({
//       status: httpStatusText.ERROR,
//       message: "Internal Server Error",
//       error: err.message,
//     });
//   }
// };

const getNewlyCustomers = async (req, res) => {
  try {
    const now = new Date();
    const users = await User.find({
      role: "user",
      state: "active",
    })
      .sort({ createdAt: -1 })
      .limit(5);

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
      .limit(5);

    const formattedOrders = await formatOrders(orders);
    // console.log("formated ", formatOrders);
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
      .limit(5) // Get only 10 products
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
