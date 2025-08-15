const express = require("express");
const ErrorLogController = require("../controllers/ErrorLogController");
const { verifyToken } = require("../middlewares");
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

// Lấy danh sách từ vựng
router.get("/", verifyToken, apiLimiter, ErrorLogController.getErrorLogs);

// Lấy từ vựng theo thư mục
router.get(
  "/folder/:folderId",
  verifyToken,
  apiLimiter,
  ErrorLogController.getErrorLogsByFolder
);

// Lấy thông tin chi tiết từ vựng
router.get(
  "/:errorLogId",
  verifyToken,
  apiLimiter,
  ErrorLogController.getErrorLogById
);

// Tạo từ vựng mới
router.post("/", verifyToken, apiLimiter, ErrorLogController.createErrorLog);

// Cập nhật từ vựng
router.put(
  "/:errorLogId",
  verifyToken,
  apiLimiter,
  ErrorLogController.updateErrorLog
);

// Cập nhật trạng thái học từ vựng
router.patch(
  "/:errorLogId/status",
  verifyToken,
  apiLimiter,
  ErrorLogController.updateErrorLogStatus
);

// Xóa từ vựng
router.delete(
  "/:errorLogId",
  verifyToken,
  apiLimiter,
  ErrorLogController.deleteErrorLog
);

module.exports = router;
