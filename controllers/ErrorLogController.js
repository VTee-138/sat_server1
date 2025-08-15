const ErrorLogModel = require("../models/ErrorLogModel.js");
const FolderQuestionModel = require("../models/FolderQuestionModel.js");
const CONSTANT = require("../utils/constant.js");
const { encryptData } = require("../utils/encryption.js");
const { default: mongoose } = require("mongoose");

// Tạo câu hỏi mới
const createErrorLog = async (req, res) => {
  try {
    const { note, questionData, folderId } = req.body;
    const userId = req.user?.id;

    if (!note || note.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Ghi chú không được để trống",
      });
    }

    if (!questionData) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Dữ liệu câu hỏi không được để trống",
      });
    }

    if (!folderId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Vui lòng chọn thư mục",
      });
    }

    // Kiểm tra thư mục có tồn tại và thuộc về user không
    const folder = await FolderQuestionModel.findOne({
      $or: [
        { _id: folderId, userId },
        { _id: folderId, author: "admin" },
      ],
    });

    if (!folder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục không tồn tại",
      });
    }

    const existingErrorLog = await ErrorLogModel.findOne({
      folderId,
      userId,
      "questionData.examId": questionData.examId,
      "questionData.questionNumber": questionData.questionNumber,
      "questionData.module": questionData.module,
      "questionData.section": questionData.section,
    });

    if (existingErrorLog) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Câu hỏi đã tồn tại trong thư mục này",
      });
    }

    const ErrorLog = new ErrorLogModel({
      ...req.body,
      folderId,
      userId,
    });

    await ErrorLog.save();

    // Populate folder info
    await ErrorLog.populate("folderId", "name color");

    return res.status(CONSTANT.OK).json({
      message: "Thêm câu hỏi vào thư mục thành công",
      data: ErrorLog,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy danh sách câu hỏi
const getErrorLogs = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, folderId } = req.query;
    const skip = (page - 1) * limit;

    let filter = { userId };

    // Lọc theo thư mục
    if (folderId) {
      filter.folderId = folderId;
    }

    const totalItems = await ErrorLogModel.countDocuments(filter);
    const errorLogs = await ErrorLogModel.find(filter)
      .populate("folderId", "name color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: errorLogs,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy thông tin chi tiết một câu hỏi
const getErrorLogById = async (req, res) => {
  try {
    const { errorLogId } = req.params;
    const userId = req.user?.id;

    const ErrorLog = await ErrorLogModel.findOne({
      _id: errorLogId,
      userId,
    })
      .populate("folderId", "name color")
      .lean();

    if (!ErrorLog) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Câu hỏi không tồn tại",
      });
    }

    return res.status(CONSTANT.OK).json({
      data: ErrorLog,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const updateErrorLog = async (req, res) => {
  try {
    const { errorLogId } = req.params;
    const { folderId, note } = req.body;
    const userId = req.user?.id;

    // Kiểm tra câu hỏi có tồn tại và thuộc về user không
    const errorLog = await ErrorLogModel.findOne({
      _id: errorLogId,
      userId,
    });

    if (!errorLog) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Câu hỏi không tồn tại",
      });
    }

    // Nếu thay đổi thư mục, kiểm tra thư mục mới
    if (folderId && folderId !== errorLog.folderId.toString()) {
      const folder = await FolderQuestionModel.findOne({
        $or: [
          { _id: folderId, userId },
          { _id: folderId, author: "admin" },
        ],
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại",
        });
      }

      const existingErrorLog = await ErrorLogModel.findOne({
        folderId,
        userId,
        "questionData.examId": questionData.examId,
        "questionData.questionNumber": questionData.questionNumber,
        "questionData.module": questionData.module,
        "questionData.section": questionData.section,
      });

      if (existingErrorLog) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "ErrorLog đã tồn tại trong thư mục này",
        });
      }
    }

    // if (!status || !["learned", "needs_review"].includes(status)) {
    //   return res.status(CONSTANT.BAD_REQUEST).json({
    //     message:
    //       "Trạng thái không hợp lệ. Chỉ chấp nhận: learned, needs_review",
    //   });
    // }

    const updatedErrorLog = await ErrorLogModel.findByIdAndUpdate(
      errorLogId,
      {
        note: note.trim(),
      },
      { new: true }
    ).populate("folderId", "name color");

    return res.status(CONSTANT.OK).json({
      message: "Cập nhật câu hỏi thành công",
      data: updatedErrorLog,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Xóa câu hỏi
const deleteErrorLog = async (req, res) => {
  try {
    const { errorLogId } = req.params;
    const userId = req.user?.id;

    // Kiểm tra câu hỏi có tồn tại và thuộc về user không
    const ErrorLog = await ErrorLogModel.findOne({
      _id: errorLogId,
      userId,
    });

    if (!ErrorLog) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Câu hỏi không tồn tại",
      });
    }

    await ErrorLogModel.findByIdAndDelete(errorLogId);

    return res.status(CONSTANT.OK).json({
      message: "Xóa câu hỏi thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy câu hỏi theo thư mục
const getErrorLogsByFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    // Kiểm tra thư mục có tồn tại và thuộc về user không
    const folder = await FolderQuestionModel.findOne({
      $or: [
        { _id: folderId, userId },
        { _id: folderId, author: "admin" },
      ],
    });

    if (!folder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục không tồn tại",
      });
    }

    let filter = { folderId, userId };

    const totalItems = await ErrorLogModel.countDocuments(filter);
    const errorLogs = await ErrorLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: errorLogs,
        folder,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Cập nhật trạng thái học câu hỏi
const updateErrorLogStatus = async (req, res) => {
  try {
    const { errorLogId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!errorLogId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "ID câu hỏi không được để trống",
      });
    }

    if (!status || !["learned", "needs_review"].includes(status)) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: not_learned, learned, needs_review",
      });
    }

    // Kiểm tra câu hỏi có tồn tại và thuộc về user không
    const ErrorLog = await ErrorLogModel.findOne({
      _id: errorLogId,
      userId,
    });

    if (!ErrorLog) {
      return res.status(CONSTANT.OK).json({
        message: "Câu hỏi không tồn tại",
      });
    }

    if (status === "learned") {
      await ErrorLogModel.deleteOne({
        _id: errorLogId,
        userId,
      });
      return res.status(CONSTANT.OK).json({
        message: "Câu hỏi đã thuộc được xóa khỏi thư mục",
      });
    }

    const updatedErrorLog = await ErrorLogModel.findByIdAndUpdate(
      errorLogId,
      { status },
      { new: true }
    );

    res.status(CONSTANT.OK).json({
      message: "Cập nhật trạng thái thành công",
      data: {
        ErrorLog: encryptData(updatedErrorLog),
      },
    });
  } catch (error) {
    console.error("Error updating ErrorLog status:", error);
    res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

module.exports = {
  createErrorLog,
  getErrorLogs,
  getErrorLogById,
  updateErrorLog,
  deleteErrorLog,
  getErrorLogsByFolder,
  updateErrorLogStatus,
};
