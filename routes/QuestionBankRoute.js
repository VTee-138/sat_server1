const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares");
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  deleteMultipleQuestions,
  getQuestionStats,
  searchQuestions,
  createMultipleQuestions,
  generateFilteredExam,
  generateRandomExam,
  getExamGenerationStats,
  getQuestionCountByCategory,
  getQuestionsByType,
  getQuestionTypes,
} = require("../controllers/QuestionBankController.js");

// Tạo câu hỏi mới (chỉ admin)
router.post("/create", verifyToken, createQuestion);

// Tạo nhiều câu hỏi cùng lúc (chỉ admin)
router.post("/create-multiple", verifyToken, createMultipleQuestions);

// Lấy danh sách câu hỏi với phân trang và filter
router.get("/", verifyToken, getQuestions);

// Tìm kiếm câu hỏi nâng cao
router.post("/search", verifyToken, searchQuestions);

// Lấy thống kê câu hỏi
router.get("/stats", verifyToken, getQuestionStats);

// Lấy số lượng câu hỏi theo từng dạng của cả 2 môn với phân cấp cha/con
router.get("/categories/count", verifyToken, getQuestionCountByCategory);

// Lấy tất cả câu hỏi dựa trên questionType và subject
router.get("/by-type", verifyToken, getQuestionsByType);

// Lấy tất cả các dạng câu hỏi theo môn học (trả về dạng cha và dạng con)
router.get("/types", verifyToken, getQuestionTypes);

// Lấy thống kê để tạo đề
router.get("/exam-stats", verifyToken, getExamGenerationStats);

// Tạo đề thi với filter (chỉ admin)
router.post("/generate-filtered-exam", verifyToken, generateFilteredExam);

// Tạo đề thi random (chỉ admin)
router.post("/generate-random-exam", verifyToken, generateRandomExam);

// Lấy câu hỏi theo ID
router.get("/:id", verifyToken, getQuestionById);

// Cập nhật câu hỏi (chỉ admin)
router.put("/:id", verifyToken, updateQuestion);

// Xóa câu hỏi (chỉ admin)
router.delete("/:id", verifyToken, deleteQuestion);

// Xóa nhiều câu hỏi (chỉ admin)
router.delete("/", verifyToken, deleteMultipleQuestions);

module.exports = router;
