const QuestionBankModel = require("../models/QuestionBankModel.js");
const UserModel = require("../models/UserModel.js");
const CONSTANT = require("../utils/constant.js");
const { encryptData } = require("../utils/encryption.js");
const { default: mongoose } = require("mongoose");
const {
  toLowerCaseNonAccentVietnamese,
  normalizeContentQuestion,
} = require("../utils/utils.js");

// Helper function để xử lý lỗi duplicate key
const handleDuplicateKeyError = (error) => {
  if (error.code === 11000 && error.keyPattern?.contentQuestionNormalized) {
    return {
      status: CONSTANT.BAD_REQUEST,
      message: "Câu hỏi với nội dung này đã tồn tại (sau khi chuẩn hóa)",
    };
  }
  return {
    status: CONSTANT.INTERNAL_SERVER_ERROR,
    message: error.message,
  };
};

// Tạo câu hỏi mới
const createQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    // Kiểm tra quyền admin
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền tạo câu hỏi",
      });
    }

    const {
      contentQuestion,
      contentAnswer,
      correctAnswer,
      subject,
      type,
      explanation,
      difficulty,
      questionType,
    } = req.body;

    // Validate required fields
    if (!contentQuestion || contentQuestion.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Nội dung câu hỏi không được để trống",
      });
    }

    // Chuẩn hóa contentQuestion và kiểm tra trùng lặp
    const normalizedContent = normalizeContentQuestion(contentQuestion);
    const existingQuestion = await QuestionBankModel.findOne({
      contentQuestionNormalized: normalizedContent,
    }).lean();

    if (existingQuestion) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Câu hỏi với nội dung tương tự đã tồn tại",
        existingQuestion: {
          id: existingQuestion._id,
          content: existingQuestion.contentQuestion,
        },
      });
    }

    if (!correctAnswer) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Đáp án đúng không được để trống",
      });
    }

    if (!subject || !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Môn học phải là MATH hoặc ENGLISH",
      });
    }

    if (!type || !["TN", "TLN"].includes(type)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Loại câu hỏi phải là TN hoặc TLN",
      });
    }

    if (!difficulty || !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Độ khó phải là EASY, MEDIUM hoặc HARD",
      });
    }

    if (!questionType) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Loại câu hỏi không được để trống",
      });
    }

    let questionTypeText = {
      text: questionType.toLowerCase().trim(),
      code: toLowerCaseNonAccentVietnamese(questionType.trim()).toLowerCase(),
    };

    const question = new QuestionBankModel({
      contentQuestion: contentQuestion.trim(),
      contentQuestionNormalized: normalizedContent,
      contentAnswer: contentAnswer || {},
      correctAnswer,
      subject,
      type,
      explanation: explanation ? explanation.trim() : "",
      difficulty,
      questionType: questionTypeText,
    });

    await question.save();

    return res.status(CONSTANT.OK).json({
      message: "Tạo câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    console.error(error);
    const errorResponse = handleDuplicateKeyError(error);
    return res.status(errorResponse.status).json({
      message: errorResponse.message,
    });
  }
};

// Lấy danh sách câu hỏi với phân trang và filter
const getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      type,
      difficulty,
      questionType,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Filter theo các trường
    if (subject && ["MATH", "ENGLISH"].includes(subject)) {
      query.subject = subject;
    }

    if (type && ["TN", "TLN"].includes(type)) {
      query.type = type;
    }

    if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    if (questionType) {
      query["questionType.code"] = questionType;
    }

    // Search theo nội dung câu hỏi
    if (search) {
      query.contentQuestion = { $regex: search, $options: "i" };
    }

    const questions = await QuestionBankModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QuestionBankModel.countDocuments(query);

    return res.status(CONSTANT.OK).json({
      message: "Lấy danh sách câu hỏi thành công",
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy câu hỏi theo ID
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "ID câu hỏi không hợp lệ",
      });
    }

    const question = await QuestionBankModel.findById(id);

    if (!question) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "Không tìm thấy câu hỏi",
      });
    }

    return res.status(CONSTANT.OK).json({
      message: "Lấy thông tin câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Cập nhật câu hỏi
const updateQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    // Kiểm tra quyền admin
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền cập nhật câu hỏi",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "ID câu hỏi không hợp lệ",
      });
    }

    const {
      contentQuestion,
      correctAnswer,
      subject,
      type,
      explanation,
      difficulty,
      questionType,
    } = req.body;

    // Validate required fields nếu có
    const updateData = {};

    if (contentQuestion !== undefined) {
      if (contentQuestion.trim() === "") {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Nội dung câu hỏi không được để trống",
        });
      }

      // Kiểm tra trùng lặp khi cập nhật
      const normalizedContent = normalizeContentQuestion(contentQuestion);
      const existingQuestion = await QuestionBankModel.findOne({
        contentQuestionNormalized: normalizedContent,
        _id: { $ne: id }, // Loại trừ chính question đang cập nhật
      }).lean();

      if (existingQuestion) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Câu hỏi với nội dung tương tự đã tồn tại",
          existingQuestion: {
            id: existingQuestion._id,
            content: existingQuestion.contentQuestion,
          },
        });
      }

      updateData.contentQuestion = contentQuestion.trim();
      updateData.contentQuestionNormalized = normalizedContent;
    }

    if (correctAnswer !== undefined) {
      if (!correctAnswer) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Đáp án đúng không được để trống",
        });
      }
      updateData.correctAnswer = correctAnswer;
    }

    if (subject !== undefined) {
      if (!["MATH", "ENGLISH"].includes(subject)) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Môn học phải là MATH hoặc ENGLISH",
        });
      }
      updateData.subject = subject;
    }

    if (type !== undefined) {
      if (!["TN", "TLN"].includes(type)) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Loại câu hỏi phải là TN hoặc TLN",
        });
      }
      updateData.type = type;
    }

    if (explanation !== undefined) {
      updateData.explanation = explanation.trim();
    }

    if (difficulty !== undefined) {
      if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Độ khó phải là EASY, MEDIUM hoặc HARD",
        });
      }
      updateData.difficulty = difficulty;
    }

    if (questionType !== undefined) {
      if (!questionType) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Loại câu hỏi không được để trống",
        });
      }

      let questionTypeText = {
        text: questionType.toLowerCase().trim(),
        code: toLowerCaseNonAccentVietnamese(questionType.trim()).toLowerCase(),
      };

      updateData.questionType = questionTypeText;
    }

    const question = await QuestionBankModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!question) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "Không tìm thấy câu hỏi",
      });
    }

    return res.status(CONSTANT.OK).json({
      message: "Cập nhật câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    console.error(error);
    const errorResponse = handleDuplicateKeyError(error);
    return res.status(errorResponse.status).json({
      message: errorResponse.message,
    });
  }
};

// Xóa câu hỏi
const deleteQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    // Kiểm tra quyền admin
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền xóa câu hỏi",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "ID câu hỏi không hợp lệ",
      });
    }

    const question = await QuestionBankModel.findByIdAndDelete(id);

    if (!question) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "Không tìm thấy câu hỏi",
      });
    }

    return res.status(CONSTANT.OK).json({
      message: "Xóa câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Xóa nhiều câu hỏi
const deleteMultipleQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    // Kiểm tra quyền admin
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền xóa câu hỏi",
      });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Danh sách ID không hợp lệ",
      });
    }

    // Validate tất cả IDs
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Có ID không hợp lệ trong danh sách",
        invalidIds,
      });
    }

    const result = await QuestionBankModel.deleteMany({ _id: { $in: ids } });

    return res.status(CONSTANT.OK).json({
      message: `Đã xóa ${result.deletedCount} câu hỏi thành công`,
      data: {
        deletedCount: result.deletedCount,
        requestedCount: ids.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy thống kê câu hỏi
const getQuestionStats = async (req, res) => {
  try {
    const totalQuestions = await QuestionBankModel.countDocuments();

    const statsBySubject = await QuestionBankModel.aggregate([
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 },
        },
      },
    ]);

    const statsByQuestionType = await QuestionBankModel.aggregate([
      {
        $group: {
          _id: "$questionType.code",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(CONSTANT.OK).json({
      message: "Lấy thống kê câu hỏi thành công",
      data: {
        total: totalQuestions,
        bySubject: statsBySubject,
        byQuestionType: statsByQuestionType,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Tìm kiếm câu hỏi nâng cao
const searchQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      subjects = [],
      types = [],
      difficulties = [],
      questionTypes = [],
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.body;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Search theo nội dung
    if (search && search.trim() !== "") {
      query.$or = [
        { contentQuestion: { $regex: search, $options: "i" } },
        { explanation: { $regex: search, $options: "i" } },
        { "questionType.text": { $regex: search, $options: "i" } },
        { "questionType.code": { $regex: search, $options: "i" } },
      ];
    }

    // Filter theo nhiều subjects
    if (Array.isArray(subjects) && subjects.length > 0) {
      const validSubjects = subjects.filter((s) =>
        ["MATH", "ENGLISH"].includes(s)
      );
      if (validSubjects.length > 0) {
        query.subject = { $in: validSubjects };
      }
    }

    // Filter theo nhiều types
    if (Array.isArray(types) && types.length > 0) {
      const validTypes = types.filter((t) => ["TN", "TLN"].includes(t));
      if (validTypes.length > 0) {
        query.type = { $in: validTypes };
      }
    }

    // Filter theo nhiều difficulties
    if (Array.isArray(difficulties) && difficulties.length > 0) {
      const validDifficulties = difficulties.filter((d) =>
        ["EASY", "MEDIUM", "HARD"].includes(d)
      );
      if (validDifficulties.length > 0) {
        query.difficulty = { $in: validDifficulties };
      }
    }

    // Filter theo nhiều questionTypes (search by code)
    if (Array.isArray(questionTypes) && questionTypes.length > 0) {
      query["questionType.code"] = { $in: questionTypes };
    }

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const questions = await QuestionBankModel.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QuestionBankModel.countDocuments(query);

    return res.status(CONSTANT.OK).json({
      message: "Tìm kiếm câu hỏi thành công",
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        searchCriteria: {
          search,
          subjects,
          types,
          difficulties,
          questionTypes,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Tạo nhiều câu hỏi cùng lúc
const createMultipleQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    // Kiểm tra quyền admin
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền tạo câu hỏi",
      });
    }

    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Danh sách câu hỏi không hợp lệ",
      });
    }

    // Thu thập và chuẩn hóa tất cả contentQuestion
    const normalizedContents = [];
    const contentMap = new Map(); // Map từ normalized content về original question

    questions.forEach((question, index) => {
      if (question.contentQuestion && question.contentQuestion.trim()) {
        const normalized = normalizeContentQuestion(question.contentQuestion);
        normalizedContents.push(normalized);

        if (contentMap.has(normalized)) {
          // Trùng lặp trong chính request
          contentMap.get(normalized).duplicateIndexes.push(index);
        } else {
          contentMap.set(normalized, {
            originalContent: question.contentQuestion.trim(),
            index,
            duplicateIndexes: [],
          });
        }
      }
    });

    // Kiểm tra trùng lặp trong chính request
    const duplicatesInRequest = [];
    contentMap.forEach((value, normalized) => {
      if (value.duplicateIndexes.length > 0) {
        duplicatesInRequest.push({
          content: value.originalContent,
          indexes: [value.index, ...value.duplicateIndexes],
        });
      }
    });

    if (duplicatesInRequest.length > 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Có câu hỏi trùng lặp trong danh sách gửi lên",
        duplicates: duplicatesInRequest,
      });
    }

    // Kiểm tra trùng lặp với database (batch query)
    if (normalizedContents.length > 0) {
      const existingQuestions = await QuestionBankModel.find(
        {
          contentQuestionNormalized: { $in: normalizedContents },
        },
        { contentQuestion: 1, contentQuestionNormalized: 1 }
      ).lean();

      if (existingQuestions.length > 0) {
        const existingMap = new Map();
        existingQuestions.forEach((eq) => {
          existingMap.set(eq.contentQuestionNormalized, eq.contentQuestion);
        });

        const duplicatesWithDB = [];
        normalizedContents.forEach((normalized) => {
          if (existingMap.has(normalized)) {
            const requestContent = contentMap.get(normalized).originalContent;
            const existingContent = existingMap.get(normalized);
            duplicatesWithDB.push({
              requestContent,
              existingContent,
            });
          }
        });

        if (duplicatesWithDB.length > 0) {
          return res.status(CONSTANT.BAD_REQUEST).json({
            message: "Một số câu hỏi đã tồn tại trong hệ thống",
            existingQuestions: duplicatesWithDB,
          });
        }
      }
    }

    // Validate từng câu hỏi
    const validatedQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const errors_for_question = [];

      if (!question.contentQuestion || question.contentQuestion.trim() === "") {
        errors_for_question.push("Nội dung câu hỏi không được để trống");
      }

      if (!question.correctAnswer) {
        errors_for_question.push("Đáp án đúng không được để trống");
      }

      if (
        !question.subject ||
        !["MATH", "ENGLISH"].includes(question.subject)
      ) {
        errors_for_question.push("Môn học phải là MATH hoặc ENGLISH");
      }

      if (!question.type || !["TN", "TLN"].includes(question.type)) {
        errors_for_question.push("Loại câu hỏi phải là TN hoặc TLN");
      }

      if (
        !question.difficulty ||
        !["EASY", "MEDIUM", "HARD"].includes(question.difficulty)
      ) {
        errors_for_question.push("Độ khó phải là EASY, MEDIUM hoặc HARD");
      }

      if (!question.questionType) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Loại câu hỏi không được để trống",
        });
      }

      let questionTypeText = {
        text: question.questionType.toLowerCase().trim(),
        code: toLowerCaseNonAccentVietnamese(
          question.questionType.trim()
        ).toLowerCase(),
      };

      if (errors_for_question.length > 0) {
        errors.push({
          index: i,
          errors: errors_for_question,
        });
      } else {
        const normalizedContent = normalizeContentQuestion(
          question.contentQuestion
        );

        validatedQuestions.push({
          contentQuestion: question.contentQuestion.trim(),
          contentQuestionNormalized: normalizedContent,
          contentAnswer: question.contentAnswer || {},
          correctAnswer: question.correctAnswer,
          subject: question.subject,
          type: question.type,
          explanation: question.explanation ? question.explanation.trim() : "",
          difficulty: question.difficulty,
          questionType: questionTypeText,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Có lỗi validation trong danh sách câu hỏi",
        errors,
      });
    }

    const createdQuestions = await QuestionBankModel.insertMany(
      validatedQuestions
    );

    return res.status(CONSTANT.OK).json({
      message: `Tạo thành công ${createdQuestions.length} câu hỏi`,
      data: {
        questions: createdQuestions,
        count: createdQuestions.length,
      },
    });
  } catch (error) {
    console.error(error);
    const errorResponse = handleDuplicateKeyError(error);
    return res.status(errorResponse.status).json({
      message: errorResponse.message,
    });
  }
};

// Tạo đề thi với filter
const generateFilteredExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { subject, filters } = req.body;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    if (!subject || !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Môn học phải là MATH hoặc ENGLISH",
      });
    }

    if (!Array.isArray(filters) || filters.length === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "filters phải là array không rỗng",
      });
    }

    // Validate từng filter
    let totalRequestedQuestions = 0;
    const validatedFilters = [];

    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      const { questionType, numberOfQuestions, difficulty } = filter;

      // Validate numberOfQuestions
      if (
        !numberOfQuestions ||
        numberOfQuestions < 1 ||
        numberOfQuestions > 50
      ) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: `Filter ${i + 1}: Số lượng câu hỏi phải từ 1 đến 50`,
        });
      }

      // Validate questionType
      if (!questionType) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: `Filter ${i + 1}: questionType là bắt buộc`,
        });
      }

      // Validate difficulty
      if (!difficulty || !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: `Filter ${i + 1}: difficulty phải là EASY, MEDIUM hoặc HARD`,
        });
      }

      totalRequestedQuestions += numberOfQuestions;
      validatedFilters.push({
        questionType,
        numberOfQuestions,
        difficulty,
      });
    }

    // Kiểm tra tổng số câu hỏi không vượt quá 50
    if (totalRequestedQuestions > 50) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: `Tổng số câu hỏi yêu cầu (${totalRequestedQuestions}) không được vượt quá 50 câu`,
        totalRequested: totalRequestedQuestions,
        maxAllowed: 50,
      });
    }

    // Kiểm tra từng filter có đủ câu hỏi không
    const allQuestions = [];

    for (let i = 0; i < validatedFilters.length; i++) {
      const filter = validatedFilters[i];

      // Tạo regex pattern để tìm kiếm questionType theo dạng chứa
      const searchPattern = filter.questionType.trim();
      const regexPatterns = [
        new RegExp(
          `^${searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(;|$)`,
          "i"
        ), // Dạng cha (bắt đầu với pattern và theo sau là ; hoặc kết thúc)
        new RegExp(
          `.*;\\s*${searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
          "i"
        ), // Dạng con (có ; trước pattern và kết thúc)
        new RegExp(
          `^${searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ), // Chính xác toàn bộ
      ];

      const query = {
        subject,
        difficulty: filter.difficulty,
        $or: regexPatterns.map((pattern) => ({
          "questionType.text": pattern,
        })),
      };

      // Kiểm tra số lượng có sẵn
      const available = await QuestionBankModel.countDocuments(query);

      if (available < filter.numberOfQuestions) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: `Filter ${i + 1} (${filter.questionType}, ${
            filter.difficulty
          }): Không đủ câu hỏi. Chỉ có ${available} câu, cần ${
            filter.numberOfQuestions
          } câu`,
          filterIndex: i + 1,
          filter: filter,
          available: available,
          required: filter.numberOfQuestions,
        });
      }

      // Lấy câu hỏi random cho filter này
      const questions = await QuestionBankModel.aggregate([
        { $match: query },
        { $sample: { size: filter.numberOfQuestions } },
        {
          $project: {
            _id: 1,
            contentQuestion: 1,
            contentAnswer: 1,
            correctAnswer: 1,
            subject: 1,
            type: 1,
            explanation: 1,
            difficulty: 1,
            questionType: 1,
          },
        },
      ]);

      allQuestions.push(...questions);
    }

    // Shuffle tất cả câu hỏi để tránh câu hỏi bị nhóm theo filter
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);

    // Tạo exam data
    const examData = {
      title: {
        text: "ĐỀ LUYỆN TẬP 10SAT",
        code: "",
      },
      numberOfQuestions: shuffledQuestions.length,
      questions: shuffledQuestions,
      subject,
      time: 90,
      subject,
    };

    return res.status(CONSTANT.OK).json({
      message: `Tạo đề thi thành công với ${validatedFilters.length} bộ filter`,
      data: examData,
    });
  } catch (error) {
    console.error("generateFilteredExam error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Tạo đề thi random
const generateRandomExam = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Không tìm thấy thông tin user",
      });
    }

    const { subject, numberOfQuestions } = req.body;

    if (!subject || !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Môn học phải là MATH hoặc ENGLISH",
      });
    }

    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 50) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Số lượng câu hỏi phải từ 1 đến 50",
      });
    }

    // Kiểm tra số lượng câu hỏi có sẵn
    const totalAvailable = await QuestionBankModel.countDocuments({ subject });

    if (totalAvailable < numberOfQuestions) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: `Không đủ câu hỏi. Chỉ có ${totalAvailable} câu hỏi môn ${subject}, cần ${numberOfQuestions} câu`,
        availableQuestions: totalAvailable,
      });
    }

    // Random lấy câu hỏi từ tất cả câu hỏi của môn học
    const questions = await QuestionBankModel.aggregate([
      { $match: { subject } },
      { $sample: { size: numberOfQuestions } },
      {
        $project: {
          _id: 1,
          contentQuestion: 1,
          contentAnswer: 1,
          correctAnswer: 1,
          subject: 1,
          type: 1,
          explanation: 1,
          difficulty: 1,
          questionType: 1,
        },
      },
    ]);

    // Tạo exam data
    const examData = {
      title: "Đề Luyện Tập 10SAT",
      numberOfQuestions,
      questions,
      subject,
    };

    return res.status(CONSTANT.OK).json({
      message: "Tạo đề thi random thành công",
      data: examData,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy thống kê để tạo đề
const getExamGenerationStats = async (req, res) => {
  try {
    const { subject } = req.query;

    if (!subject || !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Môn học phải là MATH hoặc ENGLISH",
      });
    }

    // Thống kê tổng số câu hỏi theo môn
    const totalQuestions = await QuestionBankModel.countDocuments({ subject });

    // Thống kê theo độ khó
    const statsByDifficulty = await QuestionBankModel.aggregate([
      { $match: { subject } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    // Thống kê theo loại câu hỏi
    const statsByQuestionType = await QuestionBankModel.aggregate([
      { $match: { subject } },
      {
        $group: {
          _id: "$questionType.code",
          count: { $sum: 1 },
          questionTypeName: { $first: "$questionType.text" },
        },
      },
    ]);

    // Thống kê theo type
    const statsByType = await QuestionBankModel.aggregate([
      { $match: { subject } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(CONSTANT.OK).json({
      message: "Lấy thống kê thành công",
      data: {
        subject,
        totalQuestions,
        maxQuestionsPerExam: 50,
        statistics: {
          byDifficulty: statsByDifficulty,
          byQuestionType: statsByQuestionType,
          byType: statsByType,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy số lượng câu hỏi theo từng dạng của cả 2 môn với phân cấp cha/con
const getQuestionCountByCategory = async (req, res) => {
  try {
    // Sử dụng aggregation để đếm số lượng câu hỏi theo từng dạng
    const questionCounts = await QuestionBankModel.aggregate([
      {
        $group: {
          _id: {
            subject: "$subject",
            questionTypeText: "$questionType.text",
            questionTypeCode: "$questionType.code",
          },
          totalQuestions: { $sum: 1 },
          byDifficulty: {
            $push: "$difficulty",
          },
          byType: {
            $push: "$type",
          },
        },
      },
      {
        $sort: {
          "_id.subject": 1,
          "_id.questionTypeText": 1,
        },
      },
    ]);

    // Nhóm kết quả theo môn học và phân cấp dạng cha/con
    const subjectGroups = {
      MATH: {},
      ENGLISH: {},
    };

    let totalQuestions = 0;
    let totalCategories = 0;
    let totalChildCategories = 0;

    questionCounts.forEach((item) => {
      const subject = item._id.subject;
      const questionTypeText = item._id.questionTypeText;
      const questionTypeCode = item._id.questionTypeCode;

      // Tách dạng cha và dạng con bằng dấu ;
      const parts = questionTypeText.split(";");
      const parentCategory = parts[0] ? parts[0].trim() : "Không xác định";
      const childCategory = parts[1] ? parts[1].trim() : "Chung";

      // Khởi tạo dạng cha nếu chưa có
      if (!subjectGroups[subject][parentCategory]) {
        subjectGroups[subject][parentCategory] = {
          parentCategory,
          totalQuestions: 0,
          childCategories: {},
        };
      }

      // Tính thống kê cho dạng con
      const statistics = {
        byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
        byType: { TN: 0, TLN: 0 },
      };

      item.byDifficulty.forEach((diff) => {
        if (statistics.byDifficulty[diff] !== undefined) {
          statistics.byDifficulty[diff]++;
        }
      });

      item.byType.forEach((type) => {
        if (statistics.byType[type] !== undefined) {
          statistics.byType[type]++;
        }
      });

      // Thêm dạng con
      subjectGroups[subject][parentCategory].childCategories[childCategory] = {
        childCategory,
        questionTypeText,
        questionTypeCode,
        totalQuestions: item.totalQuestions,
        statistics,
      };

      subjectGroups[subject][parentCategory].totalQuestions +=
        item.totalQuestions;
      totalQuestions += item.totalQuestions;
    });

    // Chuyển đổi thành format response
    const result = {};

    ["MATH", "ENGLISH"].forEach((subject) => {
      const subjectCategories = Object.values(subjectGroups[subject]).map(
        (parentCat) => ({
          ...parentCat,
          childCategories: Object.values(parentCat.childCategories),
        })
      );

      const subjectTotalQuestions = subjectCategories.reduce(
        (sum, cat) => sum + cat.totalQuestions,
        0
      );
      const subjectTotalChildCategories = subjectCategories.reduce(
        (sum, cat) => sum + cat.childCategories.length,
        0
      );

      result[subject] = {
        subject,
        totalQuestions: subjectTotalQuestions,
        totalCategories: subjectCategories.length,
        totalChildCategories: subjectTotalChildCategories,
        categories: subjectCategories,
      };

      totalCategories += subjectCategories.length;
      totalChildCategories += subjectTotalChildCategories;
    });

    return res.status(CONSTANT.OK).json({
      message: "Lấy số lượng câu hỏi theo dạng của cả 2 môn thành công",
      data: {
        summary: {
          totalQuestions,
          totalCategories,
          totalChildCategories,
          subjects: ["MATH", "ENGLISH"],
        },
        subjects: result,
      },
    });
  } catch (error) {
    console.error("getQuestionCountByCategory error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy tất cả câu hỏi dựa trên questionType và subject
const getQuestionsByType = async (req, res) => {
  try {
    const {
      questionType,
      subject,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate required parameters
    if (!questionType) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "questionType không được để trống",
      });
    }

    if (!subject || !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "subject phải là MATH hoặc ENGLISH",
      });
    }

    // Tạo query cơ bản
    const baseQuery = { subject };

    // Tạo regex pattern để tìm kiếm questionType
    // Tìm kiếm theo cả dạng cha và dạng con
    const searchPattern = questionType.trim();

    // Tạo các pattern tìm kiếm khác nhau:
    // 1. Tìm chính xác dạng cha (bắt đầu với questionType và theo sau là ;)
    // 2. Tìm chính xác dạng con (có ; trước questionType)
    // 3. Tìm chính xác toàn bộ text
    const regexPatterns = [
      new RegExp(
        `^${searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(;|$)`,
        "i"
      ), // Dạng cha
      new RegExp(
        `.*;\\s*${searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
        "i"
      ), // Dạng con
      new RegExp(
        `^${searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      ), // Chính xác
    ];

    // Sử dụng $or để tìm kiếm theo nhiều pattern
    const query = {
      ...baseQuery,
      $or: regexPatterns.map((pattern) => ({
        "questionType.text": pattern,
      })),
    };

    // Tạo sort object
    const sortObj = {};
    if (["createdAt", "difficulty", "questionType.text"].includes(sortBy)) {
      sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    // Lấy tất cả câu hỏi không giới hạn
    const questions = await QuestionBankModel.find(query).sort(sortObj).lean();

    return res.status(CONSTANT.OK).json({
      message: `Lấy câu hỏi theo dạng "${questionType}" môn ${subject} thành công`,
      data: {
        title: {
          text: "ĐỀ LUYỆN TẬP 10SAT",
          code: "",
        },
        numberOfQuestions: questions.length,
        time: 90,
        questions,
        subject,
      },
    });
  } catch (error) {
    console.error("getQuestionsByType error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy tất cả các dạng câu hỏi theo môn học
const getQuestionTypes = async (req, res) => {
  try {
    const { subject } = req.query;

    // Validate subject parameter
    if (!subject || !["MATH", "ENGLISH"].includes(subject)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Subject phải là 'Math' hoặc 'English'",
      });
    }

    // Lấy tất cả questionType.text unique của môn học
    const questionTypes = await QuestionBankModel.distinct(
      "questionType.text",
      {
        subject: subject,
      }
    );

    // Xử lý để tách parent và child categorie
    const allCategories = new Set();

    questionTypes.forEach((questionType) => {
      if (questionType && questionType.includes(";")) {
        const [parent, child] = questionType
          .split(";")
          .map((item) => item.trim());
        if (parent) {
          allCategories.add(parent);
        }
        if (child) {
          allCategories.add(child);
        }
      } else if (questionType) {
        // Trường hợp không có dấu ; thì coi như parent category
        parentCategories.add(questionType.trim());
        allCategories.add(questionType.trim());
      }
    });

    return res.status(CONSTANT.OK).json({
      message: `Lấy danh sách dạng câu hỏi môn ${subject} thành công`,
      data: Array.from(allCategories).sort(),
    });
  } catch (error) {
    console.error("Error in getQuestionTypes:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

module.exports = {
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
};
