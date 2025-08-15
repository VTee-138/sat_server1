const express = require("express");
const ExamResultController = require("../controllers/ExamResultController");
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
router.post(
  "/submit-test/:examId",
  verifyToken,
  apiLimiter,
  ExamResultController.submitTest
);
// Lấy điểm số từ cache (điểm số lần thi trước đó)
router.get(
  "/cached-score/:assessmentId",
  verifyToken,
  apiLimiter,
  ExamResultController.getCachedScore
);
router.get(
  "/result-detail/:assessmentId",
  verifyToken,
  apiLimiter,
  ExamResultController.getExamResultDetail
);
// Lấy danh sách bài thi đã hoàn thành
router.get(
  "/completed-assessments",
  verifyToken,
  apiLimiter,
  ExamResultController.getCompletedAssessments
);
// Lấy completion status của tất cả assessments
router.get(
  "/completion-status",
  verifyToken,
  apiLimiter,
  ExamResultController.getAssessmentCompletionStatus
);
router.get(
  "/:examId/:assessmentId",
  verifyToken,
  apiLimiter,
  ExamResultController.getExamResultbyId
);
router.get("/", apiLimiter, ExamResultController.getExamResults);
router.get(
  "/check-correct-answers/:examId/:assessmentId",
  verifyToken,
  apiLimiter,
  ExamResultController.checkCorrectAnswers
);

module.exports = router;
