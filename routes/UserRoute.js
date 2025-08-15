const express = require("express");
const UserController = require("../controllers/UserController");
const { verifyBasicAuth, verifyToken } = require("../middlewares");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { getClientIp } = require("../utils/utils");
const adminIps = ["127.0.0.1"]; // Thay bằng IP của admin
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
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
//INDEX
router.get("/", verifyToken, apiLimiter, UserController.getUsers);
router.get("/total", verifyToken, apiLimiter, UserController.totalUsers);

router.get(
  "/check-premium",
  verifyToken,
  apiLimiter,
  UserController.checkPremium
);
router.post("/", verifyToken, apiLimiter, UserController.createUser);
router.put(
  "/update-account-premium",
  verifyToken,
  apiLimiter,
  UserController.updateAccountPremium
);
router.put(
  "/update-password",
  verifyToken,
  apiLimiter,
  UserController.updatePassword
);
router.get(
  "/user-info",
  verifyToken,
  apiLimiter,
  UserController.getUserInfoById
);
router.put(
  "/premium/:userId",
  verifyToken,
  apiLimiter,
  UserController.activePremium
);
router.delete("/:userId", verifyToken, apiLimiter, UserController.deleteUser);

module.exports = router;
