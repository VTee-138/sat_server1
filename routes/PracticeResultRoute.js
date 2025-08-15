const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares");
const {
  submitPractice,
  getUserPracticeStats,
  getIncorrectQuestions,
  practiceByQuestionType,
  practiceAllIncorrect,
  updatePracticeStatus,
  updateMultiplePracticeStatus,
  updatePracticeNote,
} = require("../controllers/PracticeResultController.js");

// Nộp bài luyện tập
router.post("/submit", verifyToken, submitPractice);

// Lấy thống kê tổng quan của user
router.get("/stats", verifyToken, getUserPracticeStats);

// Lấy danh sách câu hỏi đã trả lời sai
router.get("/incorrect-questions", verifyToken, getIncorrectQuestions);

// Luyện tập theo dạng bài - Random câu hỏi sai theo questionType
router.post("/practice-by-type", verifyToken, practiceByQuestionType);

// Luyện tập tất cả - Random câu hỏi sai từ tất cả các dạng bài
router.post("/practice-all", verifyToken, practiceAllIncorrect);

// Cập nhật status của practice result
router.put("/update-status", verifyToken, updatePracticeStatus);

// Cập nhật status của practice result
router.put("/update-note", verifyToken, updatePracticeNote);

// Cập nhật status hàng loạt
router.put(
  "/update-multiple-status",
  verifyToken,
  updateMultiplePracticeStatus
);

module.exports = router;
