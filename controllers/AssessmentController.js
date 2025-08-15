const UserModel = require("../models/UserModel.js");
const AssessmentModel = require("../models/AssessmentModel.js");
const CONSTANT = require("../utils/constant.js");
const { encryptData } = require("../utils/encryption.js");
const { default: mongoose } = require("mongoose");
const { Types } = mongoose;

const insertOrUpdateAssessment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền tạo và cập nhật bài thi",
      });
    }

    const { _id } = req.body;
    let assessment = await AssessmentModel.findById(_id).lean();

    if (!assessment) {
      assessment = new AssessmentModel(req.body);
      await assessment.save();
      return res.status(CONSTANT.OK).json({
        message: "Tạo bài thi thành công",
        data: assessment,
      });
    }

    assessment = await AssessmentModel.updateOne({ _id: _id }, req.body);
    if (assessment.modifiedCount === 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Cập nhật bài thi thất bại",
        data: null,
      });
    }
    assessment = await AssessmentModel.findById(_id).lean();
    return res.status(CONSTANT.OK).json({
      message: "Cập nhật bài thi thành công",
      data: assessment,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getAssessments = async (req, res) => {
  try {
    const query = req.query.q;
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    let assessment = [];
    let totalAssessments = 0;
    if (!query) {
      totalAssessments = await AssessmentModel.countDocuments();
      assessment = await AssessmentModel.find({})
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();

      return res.status(CONSTANT.OK).json(
        encryptData({
          data: assessment,
          totalAssessments,
          totalPages: Math.ceil(totalAssessments / limit),
          currentPage: parseInt(page),
        })
      );
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);

    if (isValidObjectId) {
      totalAssessments = await AssessmentModel.countDocuments({
        $or: [
          { _id: new mongoose.Types.ObjectId(query)() },
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      });

      assessment = await AssessmentModel.find({
        $or: [
          { _id: new mongoose.Types.ObjectId(query)() },
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();
    } else {
      totalAssessments = await AssessmentModel.countDocuments({
        $or: [
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      });

      assessment = await AssessmentModel.find({
        $or: [
          { "title.text": { $regex: query, $options: "i" } },
          { "title.code": { $regex: query, $options: "i" } },
        ],
      })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: assessment,
        totalAssessments,
        totalPages: Math.ceil(totalAssessments / limit),
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

const getAssessmentById = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await AssessmentModel.findById(assessmentId).lean();
    if (!assessment) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Bài thi không tồn tại" });
    }
    return res.status(CONSTANT.OK).json(
      encryptData({
        data: assessment,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (user?.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền xóa bài thi",
      });
    }
    const dt = await AssessmentModel.deleteOne({ _id: assessmentId });
    if (dt.deletedCount === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Xóa bài thi thất bại" });
    }
    return res.status(CONSTANT.OK).json({ message: "Xóa bài thi thành công" });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const totalAssessments = async (req, res) => {
  try {
    const totalAssessments = await AssessmentModel.countDocuments();
    return res.status(CONSTANT.OK).json(
      encryptData({
        data: totalAssessments,
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
  insertOrUpdateAssessment,
  getAssessments,
  getAssessmentById,
  deleteDocument,
  totalAssessments,
};
