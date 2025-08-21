const UserModel = require("../models/UserModel.js");
const ExamModel = require("../models/ExamModel.js");
const AssessmentModel = require("../models/AssessmentModel.js");
const CONSTANT = require("../utils/constant.js");
const ExamResultModel = require("../models/ExamResultModel.js");
const {
  checkCorrectAnswersUser,
  gradeQuizExams,
  normalizeModules,
  roundToNearestTen,
} = require("../utils/utils.js");
const { encryptData } = require("../utils/encryption.js");

const submitTest = async (req, res) => {
  try {
    const { examId } = req.params;
    const { userAnswers, assessmentId } = req.body;
    let userId = req.user?.id;

    let exam = await ExamModel.findById(examId);
    if (!exam)
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đề thi không tồn tại" });

    let assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment)
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Bài thi không tồn tại" });

    if (Object.keys(exam.answer).length === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đáp án đề thi chưa được tạo" });
    }
    let exams = await ExamModel.find({
      _id: { $in: assessment.childExamIDs },
    });
    let examResult = await ExamResultModel.findOne({ userId, assessmentId });

    const score = gradeQuizExams(userAnswers, exam.answer, exam.module);

    if (!examResult) {
      examResult = new ExamResultModel({
        ...req.body,
        userAnswers: { [`${examId}`]: userAnswers },
        userId,
        totalScore: {
          "TIẾNG ANH": 0,
          TOÁN: 0,
        },
        cacheTotalScore: { "TIẾNG ANH": 0, TOÁN: 0 },
        totalNumberOfCorrectAnswers: {
          [`${exam.subject}`]: score,
        },
        modules: {
          "TIẾNG ANH": exam.subject === "TIẾNG ANH" ? [exam.module] : [],
          TOÁN: exam.subject === "TOÁN" ? [exam.module] : [],
        },
      });
      await examResult.save();
      await AssessmentModel.updateOne(
        { _id: assessmentId },
        {
          numberOfTest:
            exam.subject === "TOÁN" && exam.module.startsWith("MODULE 2")
              ? assessment.numberOfTest + 1
              : assessment.numberOfTest,
        }
      );
      return res.status(CONSTANT.OK).json({
        message: `Bạn đã nộp bài thành công`,
        isDifficulty: score["MODULE 1"] / exam.numberOfQuestions >= 0.6,
      });
    }
    let module1 = 0;
    let module2 = 0;
    let totalQuestion = 0;
    let totalScore = 0;
    if (exam.module.includes("MODULE 2")) {
      module1 =
        examResult.totalNumberOfCorrectAnswers[`${exam.subject}`]?.[
          "MODULE 1"
        ] || 0;

      module2 = score["MODULE 2"] || 0;
      const totalQuestionModule1 = exams.find(
        (e) => e.module === "MODULE 1" && e.subject === exam.subject
      );
      totalQuestion =
        totalQuestionModule1.numberOfQuestions + exam.numberOfQuestions;
      const maxScore = exam.module === "MODULE 2-DIFFICULT" ? 800 : 700;
      totalScore = ((module1 + module2) / totalQuestion) * maxScore;
    }

    totalScore = totalScore < 200 ? 200 : roundToNearestTen(totalScore);

    const updatedModules = normalizeModules(
      examResult.modules?.[`${exam.subject}`] || [],
      exam.module
    );

    let updateData = {
      totalScore: {
        ...examResult.totalScore,
        [`${exam.subject}`]: totalScore,
      },
      userAnswers: {
        ...examResult.userAnswers,
        [`${examId}`]: userAnswers,
      },
      totalNumberOfCorrectAnswers: {
        ...examResult.totalNumberOfCorrectAnswers,
        [`${exam.subject}`]: {
          ...examResult.totalNumberOfCorrectAnswers[`${exam.subject}`],
          ...score,
        },
      },
      modules: {
        ...examResult.modules,
        [`${exam.subject}`]: updatedModules,
      },
    };

    if (exam.subject === "TIẾNG ANH" && exam.module === "MODULE 1") {
      updateData.cacheTotalScore = examResult?.totalScore;
    }
    const examResultUpdate = await ExamResultModel.updateOne(
      { userId, assessmentId },
      { $set: updateData }
    );

    if (examResultUpdate.modifiedCount === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Bạn nộp bài thi thất bại" });
    }

    await AssessmentModel.updateOne(
      { _id: assessmentId },
      {
        numberOfTest:
          exam.subject === "TOÁN" && exam.module.startsWith("MODULE 2")
            ? assessment.numberOfTest + 1
            : assessment.numberOfTest,
      }
    );

    return res.status(CONSTANT.OK).json({
      message: `Bạn đã nộp bài thành công`,
      isDifficulty: score["MODULE 1"] / exam.numberOfQuestions >= 0.6,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamResultbyId = async (req, res) => {
  try {
    const { examId, assessmentId } = req.params;
    const userId = req.user?.id;

    const exam = await ExamModel.findById(examId).lean();
    if (!exam) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đề thi không tồn tại" });
    }

    const user = await UserModel.findById(userId);

    // B1: Lấy tất cả kết quả theo assessmentId & tính tổng điểm theo user
    const results = await ExamResultModel.aggregate([
      { $match: { assessmentId, userId } },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$totalScore" },
          latestUpdate: { $max: "$updatedAt" },
        },
      },
      { $sort: { totalScore: -1, latestUpdate: 1 } },
    ]);
    const examResults = await ExamResultModel.findOne({
      userId,
      examId,
      assessmentId,
    }).lean();

    // B2: Tìm tổng điểm của user hiện tại
    const currentUserResult = results.find(
      (r) => r._id.toString() === userId.toString()
    );

    if (!currentUserResult) {
      return res
        .status(CONSTANT.OK)
        .json({ message: "Bạn chưa có kết quả thi nào" });
    }

    // B3: Tính thứ hạng
    const ranking =
      results.findIndex((r) => r._id.toString() === userId.toString()) + 1;

    const detailedResults = {};

    // // B4: Lấy lại các kết quả thi cụ thể của user này (nếu muốn show)
    const data = await ExamResultModel.find({ userId, assessmentId })
      .populate("examId", "subject")
      .lean();

    data.forEach((result) => {
      detailedResults[result?.examId?.subject] = result.totalScore;
    });

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: {
          fullName: user?.fullName,
          result: detailedResults,
          totalScore: currentUserResult.totalScore,
          ranking,
          link_answer: exam?.link_answer,
          userAnswers: examResults.userAnswers,
        },
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamResults = async (req, res) => {
  try {
    const { examId, assessmentId } = req.query;
    const exam = await ExamModel.findById(examId).lean();

    if (!exam) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đề thi không tồn tại" });
    }

    const results = await ExamResultModel.aggregate([
      {
        $match: {
          assessmentId,
        },
      },
      {
        $addFields: {
          userObjectId: {
            $toObjectId: "$userId",
          },
        },
      },
      {
        $group: {
          _id: "$userObjectId",
          totalScore: { $sum: "$totalScore" },
          latestUpdate: { $max: "$updatedAt" },
        },
      },
      {
        $sort: {
          totalScore: -1,
          latestUpdate: 1,
        },
      },
      {
        $limit: 20,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          fullName: "$userInfo.fullName",
          totalScore: 1,
          latestUpdate: 1,
        },
      },
    ]);

    if (!exam.answer) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Đáp án đề thi chưa được tạo",
      });
    }

    const data = await Promise.all(
      results.map(async (r, index) => {
        const detailedResults = await ExamResultModel.find({
          userId: r.userId,
          assessmentId,
        })
          .populate("examId", "subject")
          .lean();

        const resultBySubject = {};

        for (const res of detailedResults) {
          const subjectName = res.examId?.subject;
          if (subjectName) {
            resultBySubject[subjectName] =
              (resultBySubject[subjectName] || 0) + res.totalScore;
          }
        }

        return {
          fullName: r.fullName,
          result: resultBySubject,
          totalScore: r.totalScore,
          ranking: index + 1,
        };
      })
    );

    return res.status(CONSTANT.OK).json(encryptData({ data }));
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const checkCorrectAnswers = async (req, res) => {
  try {
    let userId = req.user?.id;
    const { examId, assessmentId } = req.params;
    let exam = await ExamModel.findById(examId);

    if (!exam) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ data: null, message: "Đề thi không tồn tại" });
    }

    const user = await UserModel.findById(userId);

    if (!exam.answer) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đáp án đề thi chưa được tạo" });
    }

    let result = await ExamResultModel.findOne(
      { userId, examId, assessmentId },
      {
        userId: 1,
        examId: 1,
        userAnswers: 1,
      }
    ).lean();

    if (!result || !result.userId || !result.examId) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ data: false, message: "Bạn chưa tham gia thi thử đề này" });
    }

    const { userAnswers } = result;
    const data = checkCorrectAnswersUser(userAnswers, exam.answer);

    return res.status(CONSTANT.OK).json(
      encryptData({
        data,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

// Lấy điểm số từ cache (điểm số lần thi trước đó)
const getCachedScore = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user?.id;

    if (!assessmentId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Assessment ID không được để trống",
      });
    }

    const examResult = await ExamResultModel.findOne({
      userId,
      assessmentId,
    }).lean();

    if (!examResult) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "Chưa có kết quả thi nào",
        data: {
          cacheTotalScore: {
            "TIẾNG ANH": 0,
            TOÁN: 0,
          },
          totalScore: {
            "TIẾNG ANH": 0,
            TOÁN: 0,
          },
        },
      });
    }

    return res.status(CONSTANT.OK).json({
      message: "Lấy điểm cache thành công",
      data: {
        cacheTotalScore: examResult.cacheTotalScore || {
          "TIẾNG ANH": 0,
          TOÁN: 0,
        },
        totalScore: examResult.totalScore || {
          "TIẾNG ANH": 0,
          TOÁN: 0,
        },
        lastUpdated: examResult.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting cached score:", error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamResultDetail = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user?.id;

    if (!assessmentId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Assessment ID không được để trống",
      });
    }

    const assessment = await AssessmentModel.findById(assessmentId).lean();
    if (!assessment) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "Bài thi không tồn tại",
        data: [],
      });
    }

    const examResult = await ExamResultModel.findOne({
      userId,
      assessmentId,
    }).lean();

    if (!examResult) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "Chưa có kết quả thi nào",
        data: [],
      });
    }

    const { userAnswers = {} } = examResult;
    const resultData = [];
    const { modules = {} } = examResult;

    for (const subject of Object.keys(modules)) {
      const modulesArr = modules[subject];
      if (!Array.isArray(modulesArr) || modulesArr.length === 0) continue;
      const exams = await ExamModel.find({
        _id: { $in: assessment.childExamIDs },
        subject: subject,
        module: { $in: modulesArr },
      }).lean();
      for (const exam of exams) {
        const correctAnswers = exam.answer || {};
        const examUserAnswers = userAnswers[exam._id] || {};
        const isCorrectMap = checkCorrectAnswersUser(
          examUserAnswers,
          correctAnswers
        );
        const moduleName = exam.module.startsWith("MODULE 2")
          ? "MODULE 2"
          : exam.module;
        const section = exam.subject;
        for (const questionKey of Object.keys(correctAnswers)) {
          resultData.push({
            examId: exam._id,
            questionNumber: questionKey,
            module: moduleName,
            section: section,
            correctAnswer: correctAnswers[questionKey],
            yourAnswer: examUserAnswers[questionKey] || "",
            isCorrect: isCorrectMap[questionKey] === true,
            question: exam.questions?.find((q) => q.question === questionKey),
          });
        }
      }
    }

    return res.status(CONSTANT.OK).json({
      message: "Lấy chi tiết kết quả thành công",
      data: resultData,
      title: assessment.title?.text,
    });
  } catch (error) {
    console.error("Error getting exam result detail:", error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

// Lấy danh sách các bài thi đã hoàn thành của user
const getCompletedAssessments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "User ID không hợp lệ",
      });
    }

    // Lấy tất cả assessmentId mà user đã tham gia
    const completedAssessmentIds = await ExamResultModel.distinct(
      "assessmentId",
      { userId }
    );

    if (completedAssessmentIds.length === 0) {
      return res.status(CONSTANT.OK).json(
        encryptData({
          data: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: parseInt(page),
        })
      );
    }

    // Lấy thông tin chi tiết của các assessment
    const assessments = await AssessmentModel.find({
      _id: { $in: completedAssessmentIds },
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 })
      .lean();

    const totalItems = completedAssessmentIds.length;

    // Tính điểm và phần trăm cho từng assessment
    const assessmentsWithResults = await Promise.all(
      assessments.map(async (assessment) => {
        // Lấy kết quả thi của user cho assessment này
        const examResults = await ExamResultModel.find({
          userId,
          assessmentId: assessment._id,
        }).lean();

        if (examResults.length === 0) {
          return {
            ...assessment,
            totalScore: 0,
            maxPossibleScore: 800,
            percentage: 0,
            completedDate: null,
            numberOfExamsCompleted: 0,
          };
        }

        // Tính tổng điểm
        let totalScore = 0;
        let latestDate = null;
        let numberOfExamsCompleted = 0;

        examResults.forEach((result) => {
          // Tính tổng điểm từ tất cả các môn
          if (result.totalScore) {
            Object.values(result.totalScore).forEach((score) => {
              if (typeof score === "number") {
                totalScore += score;
              }
            });
          }

          // Đếm số bài đã hoàn thành
          if (
            result.userAnswers &&
            Object.keys(result.userAnswers).length > 0
          ) {
            numberOfExamsCompleted += Object.keys(result.userAnswers).length;
          }

          // Tìm ngày hoàn thành gần nhất
          if (
            !latestDate ||
            new Date(result.updatedAt) > new Date(latestDate)
          ) {
            latestDate = result.updatedAt;
          }
        });

        // Tính phần trăm (giả sử điểm tối đa là 800 cho mỗi môn, có 2 môn)
        const maxPossibleScore = 1600; // 800 * 2 môn
        const percentage = Math.round((totalScore / maxPossibleScore) * 100);

        return {
          ...assessment,
          totalDetailScore: examResults.map((result) => result.totalScore),
          totalScore: Math.round(totalScore),
          maxPossibleScore,
          percentage: Math.min(percentage, 100), // Đảm bảo không vượt quá 100%
          completedDate: latestDate,
          numberOfExamsCompleted:
            numberOfExamsCompleted > 4 ? 4 : numberOfExamsCompleted,
          numberOfTotalExams: 4,
        };
      })
    );

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: assessmentsWithResults,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
      })
    );
  } catch (error) {
    console.error("Error getting completed assessments:", error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

// Lấy completion status của tất cả assessments cho user
const getAssessmentCompletionStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "User ID không hợp lệ",
      });
    }

    // Lấy tất cả exam results của user
    const examResults = await ExamResultModel.find({ userId }).lean();

    // Lấy tất cả assessments
    const assessments = await AssessmentModel.find({}).lean();

    // Tạo map completion status
    const completionStatus = {};

    assessments.forEach((assessment) => {
      const userExamResults = examResults.filter(
        (result) => result.assessmentId === assessment._id.toString()
      );

      let completedExamsCount = 0;

      // SAT assessment luôn yêu cầu hoàn thành 4 bài thi (2 Toán + 2 Anh)
      // Dù có thể có 6 exams trong childExamIDs (easy/hard variants)
      // User chỉ cần hoàn thành 4 bài là được coi là completed
      const totalExamsRequired = 4;

      userExamResults.forEach((result) => {
        if (result.userAnswers && Object.keys(result.userAnswers).length > 0) {
          completedExamsCount += Object.keys(result.userAnswers).length;
        }
      });

      // Xác định trạng thái assessment
      let status = "notCompleted"; // Chưa hoàn thành bài nào
      if (completedExamsCount === 0) {
        status = "notCompleted";
      } else if (
        completedExamsCount > 0 &&
        completedExamsCount < totalExamsRequired
      ) {
        status = "inProgress"; // Đã hoàn thành một số bài nhưng chưa đủ
      } else if (completedExamsCount >= totalExamsRequired) {
        status = "isCompleted"; // Đã hoàn thành đủ số bài yêu cầu
      }

      completionStatus[assessment._id.toString()] = {
        status, // "notCompleted" | "inProgress" | "isCompleted"
        isCompleted: status === "isCompleted", // Để backward compatibility
        inProgress: status === "inProgress",
        notCompleted: status === "notCompleted",
        completedExamsCount,
        totalExamsRequired,
        progress: Math.round((completedExamsCount / totalExamsRequired) * 100),
      };
    });

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: completionStatus,
      })
    );
  } catch (error) {
    console.error("Error getting assessment completion status:", error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

module.exports = {
  submitTest,
  getExamResultbyId,
  getExamResults,
  checkCorrectAnswers,
  getCachedScore,
  getExamResultDetail,
  getCompletedAssessments,
  getAssessmentCompletionStatus,
};
