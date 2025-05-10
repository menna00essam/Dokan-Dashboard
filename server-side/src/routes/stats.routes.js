const express = require("express");
const router = express.Router();
const {
  getTotalRevenue,
  getOrderCount,
  getAvgOrderValue,
  getWeeklyStats,
  getNewlyCustomers,
  getNewlyProducts,
  getNewlyOrders,
} = require("../controllers/stats.controller");

router.get("/stats/revenue", getTotalRevenue);
router.get("/stats/orders", getOrderCount);
router.get("/stats/avg-order-value", getAvgOrderValue);
router.get("/stats/weekly-stats", getWeeklyStats);
router.get("/stats/neworders",getNewlyOrders);
router.get("/stats/customers", getNewlyCustomers);
router.get("/stats/products", getNewlyProducts);

router.get("/ping", (req, res) => {
  console.log("Ping route hit");
  res.send("pong");
});
module.exports = router;
