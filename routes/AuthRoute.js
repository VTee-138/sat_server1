const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const rateLimit = require("express-rate-limit");
const { getClientIp } = require("../utils/utils");
const adminIps = ["127.0.0.1"]; // Thay bằng IP của admin
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  handler: function (req, res) {
    res.status(429).send({
      status: 429,
      message: "Too many requests!",
    });
  },
  skip: (req) => {
    const clientIp = getClientIp(req); // Lấy IP client
    const normalizedIp = clientIp === "::1" ? "127.0.0.1" : clientIp;
    return adminIps.includes(normalizedIp); // Bỏ qua nếu IP nằm trong danh sách adminIps
  },
});

router.post("/login", authLimiter, AuthController.login);
router.post("/login-admin", authLimiter, AuthController.loginAdmin);
module.exports = router;
