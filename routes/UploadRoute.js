const express = require("express");
const UploadController = require("../controllers/UploadController");
const { verifyToken } = require("../middlewares");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const adminIps = ["127.0.0.1"]; // Thay bằng IP của admin

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit 100 uploads per hour
  handler: function (req, res) {
    res.status(429).send({
      status: 429,
      message: "Too many upload requests!",
    });
  },
  skip: (req) => {
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const normalizedIp = clientIp === "::1" ? "127.0.0.1" : clientIp;
    return adminIps.includes(normalizedIp);
  },
});

// Route upload ảnh
router.post("/image", verifyToken, uploadLimiter, UploadController.uploadImage);

// Route xóa ảnh
router.delete(
  "/image/:filename",
  verifyToken,
  uploadLimiter,
  UploadController.deleteImage
);

module.exports = router;
