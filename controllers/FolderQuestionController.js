const ErrorLogModel = require("../models/ErrorLogModel.js");
const FolderQuestionModel = require("../models/FolderQuestionModel.js");
const UserModel = require("../models/UserModel.js");
// Note: We will need a QuestionModel here later to count questions in a folder.
// const QuestionModel = require("../models/QuestionModel.js");
const CONSTANT = require("../utils/constant.js");
const { encryptData } = require("../utils/encryption.js");

// Tạo thư mục câu hỏi mới
const createFolderQuestion = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    if (!name || name.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Tên thư mục không được để trống",
      });
    }

    // Kiểm tra tên thư mục đã tồn tại chưa
    const existingFolder = await FolderQuestionModel.findOne({
      name: name.trim(),
      userId,
    });

    if (existingFolder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Tên thư mục đã tồn tại",
      });
    }

    const folder = new FolderQuestionModel({
      name: name.trim(),
      description: description || "",
      color: color || "#9e9e9e",
      userId,
      author: user.role === 1 ? "admin" : "user",
    });

    await folder.save();

    return res.status(CONSTANT.OK).json({
      message: "Tạo thư mục câu hỏi thành công",
      data: folder,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const createFolderQuestionByAdmin = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.user?.id;

    if (!name || name.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Tên thư mục không được để trống",
      });
    }

    // Kiểm tra tên thư mục đã tồn tại chưa
    const existingFolder = await FolderQuestionModel.findOne({
      name: name.trim(),
      userId,
    });

    if (existingFolder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Tên thư mục đã tồn tại",
      });
    }

    const folder = new FolderQuestionModel({
      name: name.trim(),
      description: description || "",
      color: color || "#9e9e9e",
      userId,
      author: "admin",
    });

    await folder.save();

    return res.status(CONSTANT.OK).json({
      message: "Tạo thư mục câu hỏi thành công",
      data: folder,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy danh sách thư mục câu hỏi của user
const getFolderQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      query = {
        $or: [{ userId }, { author: "admin" }],
      };
    }

    // Thêm điều kiện tìm kiếm nếu có
    if (search && search.trim()) {
      const searchCondition = {
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } },
        ],
      };

      if (query.$or) {
        // Nếu đã có điều kiện $or cho role, cần kết hợp với search
        query = {
          $and: [
            { $or: query.$or }, // Điều kiện role
            searchCondition, // Điều kiện search
          ],
        };
      } else {
        // Admin không có điều kiện role, chỉ cần thêm search
        query = searchCondition;
      }
    }

    const totalItems = await FolderQuestionModel.countDocuments(query);
    let folders = [];
    if (limit === "all") {
      folders = await FolderQuestionModel.find(query)
        .sort({ createdAt: -1 })
        .lean();
    } else {
      folders = await FolderQuestionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    // TODO: Add question count for each folder later
    for (let folder of folders) {
      folder.questionCount = await ErrorLogModel.countDocuments({
        folderId: folder._id,
      });
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: folders,
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

// Lấy thông tin chi tiết một thư mục câu hỏi
const getFolderQuestionById = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;

    const folder = await FolderQuestionModel.findOne({
      _id: folderId,
      userId,
    }).lean();

    if (!folder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục câu hỏi không tồn tại",
      });
    }

    // TODO: Add question count later
    // const questionCount = await QuestionModel.countDocuments({
    //   folderId: folder._id,
    // });
    folder.questionCount = await ErrorLogModel.countDocuments({
      folderId: folder._id,
    });

    return res.status(CONSTANT.OK).json({
      data: folder,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Cập nhật thư mục câu hỏi
const updateFolderQuestion = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, description, color } = req.body;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }

    if (!name || name.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Tên thư mục không được để trống",
      });
    }
    let folder;
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      folder = await FolderQuestionModel.findOne({
        _id: folderId,
        userId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại hoặc không có quyền cập nhật",
        });
      }
    } else {
      folder = await FolderQuestionModel.findOne({
        _id: folderId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại",
        });
      }
    }

    if (name.trim() !== folder.name) {
      const existingFolder = await FolderQuestionModel.findOne({
        name: name.trim(),
        userId,
        _id: { $ne: folderId },
      });

      if (existingFolder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Tên thư mục đã tồn tại",
        });
      }
    }

    const updatedFolder = await FolderQuestionModel.findByIdAndUpdate(
      folderId,
      {
        name: name.trim(),
        description: description || "",
        color: color || folder.color,
      },
      { new: true }
    );

    return res.status(CONSTANT.OK).json({
      message: "Cập nhật thư mục câu hỏi thành công",
      data: updatedFolder,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Xóa thư mục câu hỏi
const deleteFolderQuestion = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      const folder = await FolderQuestionModel.findOne({
        _id: folderId,
        userId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục câu hỏi không tồn tại hoặc không có quyền xóa",
        });
      }
    } else {
      const folder = await FolderQuestionModel.findOne({
        _id: folderId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục câu hỏi không tồn tại",
        });
      }
    }

    // TODO: Delete all questions in the folder later
    // await QuestionModel.deleteMany({ folderId });

    await FolderQuestionModel.findByIdAndDelete(folderId);

    return res.status(CONSTANT.OK).json({
      message: "Xóa thư mục câu hỏi thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

module.exports = {
  createFolderQuestion,
  getFolderQuestions,
  getFolderQuestionById,
  updateFolderQuestion,
  deleteFolderQuestion,
  createFolderQuestionByAdmin,
};
