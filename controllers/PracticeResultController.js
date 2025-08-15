const PracticeResultModel = require("../models/PracticeResultModel.js");
const QuestionBankModel = require("../models/QuestionBankModel.js");
const UserModel = require("../models/UserModel.js");
const CONSTANT = require("../utils/constant.js");
const { default: mongoose } = require("mongoose");
const { isNumeric } = require("../utils/utils.js");

// Nộp bài luyện tập và lưu kết quả từng câu
const submitPractice = async (req, res) => {
  try {
    const { userAnswers } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    if (!userAnswers || typeof userAnswers !== "object") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "userAnswers không hợp lệ",
      });
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "User không tồn tại",
      });
    }

    // Get question IDs from userAnswers
    const questionIds = Object.keys(userAnswers);

    // Validate that all questions exist in database
    const questionData = await QuestionBankModel.find({
      _id: { $in: questionIds },
    }).lean();

    const foundQuestionIds = new Set(questionData.map((q) => q._id.toString()));
    const invalidQuestionIds = questionIds.filter(
      (id) => !foundQuestionIds.has(id)
    );

    if (invalidQuestionIds.length > 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Một số câu hỏi không tồn tại",
        invalidQuestionIds,
      });
    }

    // Create a map for quick question lookup
    const questionMap = new Map();
    questionData.forEach((q) => {
      questionMap.set(q._id.toString(), q);
    });

    // Score each question and prepare batch insert data
    const practiceResults = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    for (const questionId of questionIds) {
      const userAnswer = userAnswers[questionId];
      const question = questionMap.get(questionId);

      if (!question) continue;

      totalQuestions++;

      // Compare user answer with correct answer
      let isCorrect = false;

      if (question.correctAnswer) {
        // Handle different correct answer formats
        if (typeof question.correctAnswer === "string") {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (Array.isArray(question.correctAnswer)) {
          isCorrect = question.correctAnswer?.includes(
            isNumeric(userAnswer) ? parseFloat(userAnswer) : userAnswer
          );
        }
      }

      if (isCorrect) {
        correctAnswers++;
      }

      // Prepare data for batch insert/update
      practiceResults.push({
        questionId: questionId,
        userId: userId,
        isCorrect: isCorrect,
        userAnswer,
      });
    }

    // Batch save/update practice results using bulkWrite for better performance
    const bulkOps = practiceResults.map((result) => ({
      updateOne: {
        filter: { questionId: result.questionId, userId: result.userId },
        update: {
          $set: {
            isCorrect: result.isCorrect,
            userAnswer: result.userAnswer,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await PracticeResultModel.bulkWrite(bulkOps);
    }

    // Calculate statistics
    const accuracy =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    return res.status(CONSTANT.OK).json({
      message: "Nộp bài luyện tập thành công",
      data: {
        userId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        accuracy,
      },
    });
  } catch (error) {
    console.error("submitPractice error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy thống kê tổng quan của user
const getUserPracticeStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Tổng số câu hỏi trong ngân hàng
    const totalQuestions = await QuestionBankModel.countDocuments();

    // Số câu hỏi đã làm (theo userId)
    const questionsAnswered = await PracticeResultModel.countDocuments({
      userId: userId,
    });

    // Số câu đúng (theo userId, isCorrect = true)
    const correctAnswers = await PracticeResultModel.countDocuments({
      userId: userId,
      isCorrect: true,
    });

    // Số câu sai (theo userId, isCorrect = false)
    const incorrectAnswers = await PracticeResultModel.countDocuments({
      userId: userId,
      isCorrect: false,
    });

    // Tính phần trăm
    const progressPercentage =
      totalQuestions > 0
        ? Math.round((questionsAnswered / totalQuestions) * 100)
        : 0;

    const accuracyPercentage =
      questionsAnswered > 0
        ? Math.round((correctAnswers / questionsAnswered) * 100)
        : 0;

    return res.status(CONSTANT.OK).json({
      message: "Lấy thống kê thành công",
      data: {
        userId,
        totalQuestions,
        questionsAnswered,
        correctAnswers,
        incorrectAnswers,
        remainingQuestions: totalQuestions - questionsAnswered,
        progressPercentage,
        accuracyPercentage,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy danh sách tất cả câu hỏi đã trả lời sai
const getIncorrectQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Execute aggregation
    const incorrectQuestions = await PracticeResultModel.find({
      userId: userId,
      isCorrect: false,
    }).populate("questionId");

    return res.status(CONSTANT.OK).json({
      message: "Lấy danh sách câu hỏi sai thành công",
      data: incorrectQuestions,
    });
  } catch (error) {
    console.error("getIncorrectQuestions error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Luyện tập theo dạng bài - Random câu hỏi sai theo questionType và subject
const practiceByQuestionType = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { questionType, numberOfQuestions = 10, subject } = req.body;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Validate questionType
    if (!questionType) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "questionType không hợp lệ",
      });
    }

    // Validate subject if provided
    if (subject && !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "subject phải là MATH hoặc ENGLISH",
      });
    }

    // Validate numberOfQuestions
    const numQuestions = parseInt(numberOfQuestions);
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 50) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "numberOfQuestions phải là số từ 1 đến 50",
      });
    }

    // Build match conditions for QuestionBank lookup
    const questionBankMatch = {
      $and: [
        { $eq: ["$_id", "$$questionId"] },
        { $eq: ["$questionType.code", questionType] },
      ],
    };

    // Add subject filter if provided
    if (subject) {
      questionBankMatch.$and.push({ $eq: ["$subject", subject] });
    }

    // Aggregation pipeline to get random incorrect questions by questionType and subject
    const pipeline = [
      // Match practice results for user with isCorrect = false
      {
        $match: {
          userId: userId,
          isCorrect: false,
        },
      },
      // Lookup question details from QuestionBanks
      {
        $lookup: {
          from: "question_banks",
          let: { questionId: { $toObjectId: "$questionId" } },
          pipeline: [
            {
              $match: {
                $expr: questionBankMatch,
              },
            },
            {
              $project: {
                contentQuestion: 1,
                contentAnswer: 1,
                correctAnswer: 1,
                subject: 1,
                type: 1,
                difficulty: 1,
                questionType: 1,
                explanation: 1,
              },
            },
          ],
          as: "questionData",
        },
      },
      // Unwind to get question data (only include if question matches criteria)
      {
        $unwind: {
          path: "$questionData",
          preserveNullAndEmptyArrays: false, // Only include if question exists and matches criteria
        },
      },
      // Random sample
      {
        $sample: { size: numQuestions },
      },
      // Project final structure
      {
        $project: {
          _id: 1,
          questionId: 1,
          userId: 1,
          isCorrect: 1,
          createdAt: 1,
          updatedAt: 1,
          question: "$questionData",
        },
      },
    ];

    // Execute aggregation
    const practiceQuestions = await PracticeResultModel.aggregate(pipeline);

    // Get question type information with subject filter
    const questionTypeQuery = { "questionType.code": questionType };
    if (subject) {
      questionTypeQuery.subject = subject;
    }

    const errorMessage = subject
      ? `Không tìm thấy câu hỏi sai nào cho dạng bài "${questionType}" môn ${subject}`
      : `Không tìm thấy câu hỏi sai nào cho dạng bài "${questionType}"`;

    const successMessage = subject
      ? `Lấy câu hỏi luyện tập theo dạng bài môn ${subject} thành công`
      : "Lấy câu hỏi luyện tập theo dạng bài thành công";

    if (practiceQuestions.length === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: errorMessage,
        data: {
          title: "Đề Luyện Tập 10SAT",
          numberOfQuestions,
          questions: practiceQuestions,
          subject,
        },
      });
    }

    if (practiceQuestions.length < numQuestions) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không đủ câu hỏi luyện tập",
        data: {
          title: "Đề Luyện Tập 10SAT",
          numberOfQuestions,
          questions: [],
          subject,
        },
      });
    }

    // $sample đã lấy đúng số lượng cần thiết, không cần slice
    return res.status(CONSTANT.OK).json({
      message: successMessage,
      data: {
        title: "Đề Luyện Tập 10SAT",
        numberOfQuestions: practiceQuestions.length,
        questions: practiceQuestions,
        subject,
      },
    });
  } catch (error) {
    console.error("practiceByQuestionType error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Luyện tập tất cả - Random câu hỏi sai từ tất cả các dạng bài
const practiceAllIncorrect = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { numberOfQuestions = 10, subject } = req.body;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Validate numberOfQuestions
    const numQuestions = parseInt(numberOfQuestions);
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 50) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "numberOfQuestions phải là số từ 1 đến 50",
      });
    }

    // Build base match condition
    const baseMatch = {
      userId: userId,
      isCorrect: false,
    };

    // Build question lookup match condition
    const questionLookupMatch = {
      $expr: { $eq: ["$_id", "$$questionId"] },
    };

    // Add subject filter if provided
    if (subject && ["MATH", "ENGLISH"].includes(subject)) {
      questionLookupMatch.$expr = {
        $and: [
          { $eq: ["$_id", "$$questionId"] },
          { $eq: ["$subject", subject] },
        ],
      };
    }

    // Aggregation pipeline to get random incorrect questions from all types
    const pipeline = [
      // Match practice results for user with isCorrect = false
      {
        $match: baseMatch,
      },
      // Lookup question details from QuestionBanks
      {
        $lookup: {
          from: "question_banks",
          let: { questionId: { $toObjectId: "$questionId" } },
          pipeline: [
            {
              $match: questionLookupMatch,
            },
            {
              $project: {
                contentQuestion: 1,
                contentAnswer: 1,
                correctAnswer: 1,
                subject: 1,
                type: 1,
                difficulty: 1,
                questionType: 1,
                explanation: 1,
              },
            },
          ],
          as: "questionData",
        },
      },
      // Unwind to get question data (only include if question exists)
      {
        $unwind: {
          path: "$questionData",
          preserveNullAndEmptyArrays: false,
        },
      },
      // Random sample
      {
        $sample: { size: numQuestions },
      },
      // Project final structure
      {
        $project: {
          _id: 1,
          questionId: 1,
          userId: 1,
          isCorrect: 1,
          createdAt: 1,
          updatedAt: 1,
          question: "$questionData",
        },
      },
    ];

    // Execute aggregation
    const practiceQuestions = await PracticeResultModel.aggregate(pipeline);

    if (practiceQuestions.length === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: subject
          ? `Không tìm thấy câu hỏi sai nào cho môn ${subject}`
          : "Không tìm thấy câu hỏi sai nào",
        data: {
          title: "Đề Luyện Tập 10SAT",
          numberOfQuestions,
          questions: [],
          subject,
        },
      });
    }

    if (practiceQuestions.length < numQuestions) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không đủ câu hỏi luyện tập",
        data: {
          title: "Đề Luyện Tập 10SAT",
          numberOfQuestions,
          questions: [],
          subject,
        },
      });
    }
    // $sample đã lấy đúng số lượng cần thiết, không cần slice
    return res.status(CONSTANT.OK).json({
      message: subject
        ? `Lấy câu hỏi luyện tập tất cả dạng bài môn ${subject} thành công`
        : "Lấy câu hỏi luyện tập tất cả dạng bài thành công",
      data: {
        title: "Đề Luyện Tập 10SAT",
        numberOfQuestions: practiceQuestions.length,
        questions: practiceQuestions,
        subject,
      },
    });
  } catch (error) {
    console.error("practiceAllIncorrect error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Cập nhật status của practice result
const updatePracticeStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id, status } = req.body;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Validate input
    if (!id) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "id là bắt buộc",
      });
    }

    if (!status || !["need_to_review", "learned"].includes(status)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "status phải là 'need_to_review' hoặc 'learned'",
      });
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "User không tồn tại",
      });
    }

    // Check if practice result exists
    const existingResult = await PracticeResultModel.findOne({
      _id: id,
      userId: userId,
    });

    if (!existingResult) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Chưa có kết quả luyện tập cho câu hỏi này",
      });
    }

    // Update status
    await PracticeResultModel.deleteOne({ _id: id, userId: userId });

    return res.status(CONSTANT.OK).json({
      message: `Cập nhật trạng thái thành '${status}' thành công`,
    });
  } catch (error) {
    console.error("updatePracticeStatus error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const updatePracticeNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id, note } = req.body;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Validate input
    if (!id) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "id là bắt buộc",
      });
    }

    if (!note) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "note là bắt buộc",
      });
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "User không tồn tại",
      });
    }

    // Check if practice result exists
    const existingResult = await PracticeResultModel.findOne({
      _id: id,
      userId: userId,
    });

    if (!existingResult) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Chưa có kết quả luyện tập cho câu hỏi này",
      });
    }

    // Update status
    const updatedResult = await PracticeResultModel.findOneAndUpdate(
      { _id: id, userId: userId },
      { $set: { note: note } },
      { new: true, runValidators: true }
    ).populate("questionId");

    return res.status(CONSTANT.OK).json({
      message: `Cập nhật note thành công`,
    });
  } catch (error) {
    console.error("updatePracticeStatus error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Cập nhật status hàng loạt cho nhiều practice results
const updateMultiplePracticeStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { updates } = req.body; // Array of {questionId, status}

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "updates phải là array không rỗng",
      });
    }

    if (updates.length > 100) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Chỉ có thể cập nhật tối đa 100 câu hỏi cùng lúc",
      });
    }

    // Validate each update
    const validStatuses = ["need_to_review", "learned"];
    for (const update of updates) {
      if (!update.questionId) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Mỗi update phải có questionId",
        });
      }
      if (!update.status || !validStatuses.includes(update.status)) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message:
            "Mỗi update phải có status là 'need_to_review' hoặc 'learned'",
        });
      }
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "User không tồn tại",
      });
    }

    // Get all questionIds to verify they exist
    const questionIds = updates.map((update) => update.questionId);
    const existingQuestions = await QuestionBankModel.find({
      _id: { $in: questionIds },
    });

    if (existingQuestions.length !== questionIds.length) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Một số câu hỏi không tồn tại",
      });
    }

    // Check which practice results exist
    const existingResults = await PracticeResultModel.find({
      questionId: { $in: questionIds },
      userId: userId,
    });

    const existingQuestionIds = new Set(
      existingResults.map((result) => result.questionId.toString())
    );

    const missingResults = updates.filter(
      (update) => !existingQuestionIds.has(update.questionId)
    );

    if (missingResults.length > 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Một số câu hỏi chưa có kết quả luyện tập",
        missingQuestionIds: missingResults.map((r) => r.questionId),
      });
    }

    // Prepare bulk operations
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { questionId: update.questionId, userId: userId },
        update: { $set: { status: update.status } },
      },
    }));

    // Execute bulk update
    const bulkResult = await PracticeResultModel.bulkWrite(bulkOps);

    // Get updated results for response
    const updatedResults = await PracticeResultModel.find({
      questionId: { $in: questionIds },
      userId: userId,
    }).populate(
      "questionId",
      "contentQuestion questionType subject difficulty"
    );

    return res.status(CONSTANT.OK).json({
      message: `Cập nhật trạng thái cho ${bulkResult.modifiedCount} câu hỏi thành công`,
      data: {
        totalUpdates: updates.length,
        successfulUpdates: bulkResult.modifiedCount,
        results: updatedResults.map((result) => ({
          _id: result._id,
          questionId: result.questionId._id,
          questionContent: result.questionId.contentQuestion,
          questionType: result.questionId.questionType,
          subject: result.questionId.subject,
          difficulty: result.questionId.difficulty,
          userId: result.userId,
          isCorrect: result.isCorrect,
          status: result.status,
          updatedAt: result.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("updateMultiplePracticeStatus error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

module.exports = {
  submitPractice,
  getUserPracticeStats,
  getIncorrectQuestions,
  practiceByQuestionType,
  practiceAllIncorrect,
  updatePracticeStatus,
  updateMultiplePracticeStatus,
  updatePracticeNote,
};
