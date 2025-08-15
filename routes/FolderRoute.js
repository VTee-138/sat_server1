const express = require("express");
const FolderController = require("../controllers/FolderController");
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

// Lấy danh sách thư mục
router.get("/", verifyToken, apiLimiter, FolderController.getFolders);

// Lấy thông tin chi tiết thư mục
router.get(
  "/:folderId",
  verifyToken,
  apiLimiter,
  FolderController.getFolderById
);

// Tạo thư mục mới
router.post("/", verifyToken, apiLimiter, FolderController.createFolder);

// Cập nhật thư mục
router.put(
  "/:folderId",
  verifyToken,
  apiLimiter,
  FolderController.updateFolder
);

// Xóa thư mục
router.delete(
  "/:folderId",
  verifyToken,
  apiLimiter,
  FolderController.deleteFolder
);

module.exports = router;
