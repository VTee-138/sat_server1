const express = require("express");
const ExamController = require("../controllers/ExamController");
const { verifyToken, verifyTokenExam } = require("../middlewares");
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
router.post("/", verifyToken, apiLimiter, ExamController.insertOrUpdateExam);
router.get("/total", verifyToken, apiLimiter, ExamController.totalExams);
router.get("/", verifyToken, apiLimiter, ExamController.getExams);
router.get(
  "/top-trending",
  verifyToken,
  apiLimiter,
  ExamController.getExamsTopTrending
);
router.post("/ids", verifyToken, apiLimiter, ExamController.getExamByIds);

router.get(
  "/categories",
  verifyToken,
  apiLimiter,
  ExamController.getCategories
);
router.get(
  "/exam-idtitle",
  verifyToken,
  apiLimiter,
  ExamController.getExamsByIdAndTitle
);
router.get("/search", verifyToken, apiLimiter, ExamController.searchExam);
router.get(
  "/exams-muti-search",
  verifyToken,
  apiLimiter,
  ExamController.getExamsMutiSearch
);
router.post(
  "/active/:examId",
  verifyToken,
  apiLimiter,
  ExamController.activeExam
);
router.get(
  "/by-assessmentId/:assessmentId",
  verifyToken,
  apiLimiter,
  ExamController.getExamByAssessmentId
);
router.get("/:examId", verifyToken, apiLimiter, ExamController.getExamById);
router.delete("/:examId", verifyToken, apiLimiter, ExamController.deleteExam);
module.exports = router;
