const express = require("express");
const DocumentController = require("../controllers/AssessmentController");
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

router.post(
  "/",
  verifyToken,
  apiLimiter,
  DocumentController.insertOrUpdateAssessment
);

router.get(
  "/total",
  verifyToken,
  apiLimiter,
  DocumentController.totalAssessments
);
router.get("/", verifyToken, apiLimiter, DocumentController.getAssessments);
router.get(
  "/:assessmentId",
  verifyToken,
  apiLimiter,
  DocumentController.getAssessmentById
);
router.delete(
  "/:assessmentId",
  verifyToken,
  apiLimiter,
  DocumentController.deleteDocument
);

module.exports = router;
