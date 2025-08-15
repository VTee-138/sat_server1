const express = require("express");
const VocabularyController = require("../controllers/VocabularyController");
const { verifyToken } = require("../middlewares");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { getClientIp } = require("../utils/utils");
const multer = require("multer");

// Cấu hình multer cho upload file Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx, .xls)"), false);
    }
  },
});
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
router.get("/", verifyToken, apiLimiter, VocabularyController.getVocabularies);

// Lấy từ vựng theo thư mục
router.get(
  "/folder/:folderId",
  verifyToken,
  apiLimiter,
  VocabularyController.getVocabulariesByFolder
);

// Lấy thông tin chi tiết từ vựng
router.get(
  "/:vocabularyId",
  verifyToken,
  apiLimiter,
  VocabularyController.getVocabularyById
);

// Tạo từ vựng mới
router.post(
  "/",
  verifyToken,
  apiLimiter,
  VocabularyController.createVocabulary
);

// Cập nhật từ vựng
router.put(
  "/:vocabularyId",
  verifyToken,
  apiLimiter,
  VocabularyController.updateVocabulary
);

// Cập nhật trạng thái học từ vựng
router.patch(
  "/:vocabularyId/status",
  verifyToken,
  apiLimiter,
  VocabularyController.updateVocabularyStatus
);

// Xóa từ vựng
router.delete(
  "/:vocabularyId",
  verifyToken,
  apiLimiter,
  VocabularyController.deleteVocabulary
);

// Import từ vựng từ file Excel
router.post(
  "/import",
  verifyToken,
  apiLimiter,
  upload.single("file"),
  VocabularyController.importVocabulariesFromExcel
);

module.exports = router;
