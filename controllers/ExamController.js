const UserModel = require("../models/UserModel.js");
const ExamModel = require("../models/ExamModel.js");
const CONSTANT = require("../utils/constant.js");
const { handleMaxScore } = require("../utils/utils.js");
const { encryptData } = require("../utils/encryption.js");
const { default: mongoose, Types } = require("mongoose");
const AssessmentModel = require("../models/AssessmentModel.js");

const insertOrUpdateExam = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền tạo và cập nhật đề thi",
      });
    }

    if (
      !["MODULE 1", "MODULE 2-EASY", "MODULE 2-DIFFICULT"].includes(
        req.body.module
      )
    ) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Kiểu dữ liệu của module không hợp lệ",
      });
    }

    const { _id } = req.body;
    let exam = await ExamModel.findById(_id).lean();

    if (!exam) {
      exam = new ExamModel(req.body);
      await exam.save();
      return res.status(CONSTANT.OK).json({
        message: "Tạo đề thi thành công",
        data: exam,
      });
    }

    exam = await ExamModel.updateOne({ _id: _id }, req.body);
    if (exam.modifiedCount === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Cập nhật đề thi thất bại",
        data: null,
      });
    }
    exam = await ExamModel.findOne({ _id: _id }).lean();
    return res.status(CONSTANT.OK).json({
      message: "Cập nhật đề thi thành công",
      data: exam,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExams = async (req, res) => {
  try {
    const query = req.query.q;
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    if (!query) {
      const totalItems = await ExamModel.countDocuments();
      let items = await ExamModel.find({})
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();

      return res.status(CONSTANT.OK).json(
        encryptData({
          data: items,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page),
        })
      );
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);
    let totalExamsCount = 0;
    let exams = [];
    if (isValidObjectId) {
      totalExamsCount = await ExamModel.countDocuments({
        $or: [
          { _id: new mongoose.Types.ObjectId(query) },
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      });

      exams = await ExamModel.find({
        $or: [
          { _id: new mongoose.Types.ObjectId(query) },
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      totalExamsCount = await ExamModel.countDocuments({
        $or: [
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      });

      exams = await ExamModel.find({
        $or: [
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: exams,
        totalExams: totalExamsCount,
        totalPages: Math.ceil(totalExamsCount / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    let condition = {};
    if (type) {
      condition = {
        type,
      };
    }
    const totalItems = await ExamModel.countDocuments(condition);
    let items = await ExamModel.find(condition, {
      answer: 0,
      link_answer: 0,
      url: 0,
      questions: 0,
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: items,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamsTopTrending = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    const totalItems = await ExamModel.countDocuments();
    let items = await ExamModel.find(
      {},
      { answer: 0, link_answer: 0, url: 0, questions: 0 }
    )
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ numberOfTest: -1 })
      .lean();

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: items,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamsByIdAndTitle = async (req, res) => {
  try {
    let data = await ExamModel.find({}, { title: 1, _id: 1 }).lean();

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

const getExamById = async (req, res) => {
  try {
    const { examId } = req.params;
    let userId = req.user?.id;

    const exam = await ExamModel.findById(examId).lean();
    if (!exam) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đề thi không tồn tại" });
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: exam,
        maxScore: handleMaxScore(exam.answer, exam.type),
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const searchExam = async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let exams = [];
    let totalExams = 0;

    if (!query) {
      totalExams = await ExamModel.countDocuments();
      exams = await ExamModel.find(
        {},
        { answer: 0, link_answer: 0, url: 0, questions: 0 }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json(
        encryptData({
          data: exams,
          totalExams,
          totalPages: Math.ceil(totalExams / limit),
          currentPage: page,
        })
      );
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);

    if (isValidObjectId) {
      totalExams = await ExamModel.countDocuments({
        $or: [
          { _id: new mongoose.Types.ObjectId(query) },
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      });

      exams = await ExamModel.find(
        {
          $or: [
            { _id: new mongoose.Types.ObjectId(query) },
            { "title.text": { $regex: query, $options: "i" } },
            { "title.code": { $regex: query, $options: "i" } },
          ],
        },
        { answer: 0, link_answer: 0, url: 0, questions: 0 }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } else {
      totalExams = await ExamModel.countDocuments({
        $or: [
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      });

      exams = await ExamModel.find(
        {
          $or: [
            { "title.text": { $regex: query, $options: "i" } },
            { "title.code": { $regex: query, $options: "i" } },
          ],
        },
        { answer: 0, link_answer: 0, url: 0, questions: 0 }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: exams,
        totalExams,
        totalPages: Math.ceil(totalExams / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const activeExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (user?.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền cập nhật trạng thái đề thi",
      });
    }
    let exam = await ExamModel.findById(examId);
    if (!exam) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Đề thi không tồn tại" });
    }
    exam = await ExamModel.updateOne({ _id: examId }, { active: !exam.active });
    if (exam.modifiedCount === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Cập nhật trạng thái đề thi thất bại" });
    }
    return res
      .status(CONSTANT.OK)
      .json({ message: "Cập nhật trạng thái đề thi thành công" });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (user?.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền xóa đề thi",
      });
    }
    const dt = await ExamModel.deleteOne({ _id: examId });
    if (dt.deletedCount === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Xóa đề thi thất bại" });
    }
    await AssessmentModel.updateOne(
      { childExamIDs: { $in: [examId] } },
      { $pull: { childExamIDs: examId } }
    );
    return res.status(CONSTANT.OK).json({ message: "Xóa đề thi thành công" });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const totalExams = async (req, res) => {
  try {
    const totalExams = await ExamModel.countDocuments();
    return res.status(CONSTANT.OK).json(
      encryptData({
        data: totalExams,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamsMutiSearch = async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 20;

    let searchCondition = {};

    // Nếu có query search, tìm kiếm theo title
    if (query && query.trim()) {
      searchCondition = {
        $or: [
          { "title.text": { $regex: query.trim(), $options: "i" } },
          { "title.code": { $regex: query.trim(), $options: "i" } },
          { subject: { $regex: query.trim(), $options: "i" } },
        ],
      };
    }

    const data = await ExamModel.find(searchCondition, {
      title: 1,
      subject: 1,
      numberOfQuestions: 1,
      time: 1,
    })
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(CONSTANT.OK).json(
      encryptData({
        data,
        total: data.length,
        limit,
        hasMore: data.length === limit,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getExamByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const data = await ExamModel.find(
      {
        _id: { $in: objectIds },
      },
      {
        title: 1,
        subject: 1,
        numberOfQuestions: 1,
        time: 1,
      }
    ).lean();

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

const getExamByAssessmentId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { assessmentId } = req.params;
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Bài thi không tồn tại" });
    }
    const objectIds = assessment.childExamIDs?.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const data = await ExamModel.find({
      _id: { $in: objectIds },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    let totalExams = await ExamModel.countDocuments({
      _id: { $in: objectIds },
    });
    return res.status(CONSTANT.OK).json(
      encryptData({
        data,
        totalExams,
        totalPages: Math.ceil(totalExams / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

module.exports = {
  insertOrUpdateExam,
  getExams,
  getExamById,
  searchExam,
  activeExam,
  deleteExam,
  getExamsTopTrending,
  getExamsByIdAndTitle,
  getCategories,
  totalExams,
  getExamsMutiSearch,
  getExamByIds,
  getExamByAssessmentId,
};
