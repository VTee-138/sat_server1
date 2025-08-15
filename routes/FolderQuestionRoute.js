const express = require("express");
const FolderQuestionController = require("../controllers/FolderQuestionController");
const { verifyToken } = require("../middlewares");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { getClientIp } = require("../utils/utils");
const adminIps = ["127.0.0.1"]; // Thay bằng IP của admin
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  skip: (req) => {
    const clientIp = getClientIp(req); // Lấy IP client
    const normalizedIp = clientIp === "::1" ? "127.0.0.1" : clientIp;
    return adminIps.includes(normalizedIp); // Bỏ qua nếu IP nằm trong danh sách adminIps
  },
});

// Lấy danh sách thư mục
router.get(
  "/",
  verifyToken,
  apiLimiter,
  FolderQuestionController.getFolderQuestions
);

// Lấy thông tin chi tiết thư mục
router.get(
  "/:folderId",
  verifyToken,
  apiLimiter,
  FolderQuestionController.getFolderQuestionById
);

// Tạo thư mục mới
router.post(
  "/",
  verifyToken,
  apiLimiter,
  FolderQuestionController.createFolderQuestion
);

// Tạo thư mục mới bởi Admin
router.post(
  "/admin",
  verifyToken,
  apiLimiter,
  FolderQuestionController.createFolderQuestionByAdmin
);
// Cập nhật thư mục
router.put(
  "/:folderId",
  verifyToken,
  apiLimiter,
  FolderQuestionController.updateFolderQuestion
);

// Xóa thư mục
router.delete(
  "/:folderId",
  verifyToken,
  apiLimiter,
  FolderQuestionController.deleteFolderQuestion
);

module.exports = router;
