const FolderModel = require("../models/FolderModel.js");
const VocabularyModel = require("../models/VocabularyModel.js");
const UserModel = require("../models/UserModel.js");
const CONSTANT = require("../utils/constant.js");
const { encryptData } = require("../utils/encryption.js");

// Tạo thư mục mới
const createFolder = async (req, res) => {
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
    const existingFolder = await FolderModel.findOne({
      name: name.trim(),
      userId,
    });

    if (existingFolder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Tên thư mục đã tồn tại",
      });
    }

    const folder = new FolderModel({
      name: name.trim(),
      description: description || "",
      color: color || "#9e9e9e",
      userId,
      author: user.role === 1 ? "admin" : "user",
    });

    await folder.save();

    return res.status(CONSTANT.OK).json({
      message: "Tạo thư mục thành công",
      data: folder,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy danh sách thư mục của user
const getFolders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (page - 1) * limit;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    let query = {};
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      query = {
        $or: [{ userId }, { author: "admin" }],
      };
    }

    // Thêm điều kiện search nếu có
    if (search && search.trim() !== "") {
      query.$and = [
        {
          $or: [
            { name: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
          ],
        },
      ];
    }

    const totalItems = await FolderModel.countDocuments(query);
    let folders = [];
    if (limit === "all") {
      folders = await FolderModel.find(query).sort({ createdAt: -1 }).lean();
    } else {
      folders = await FolderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    // Thêm số lượng từ vựng cho mỗi thư mục
    for (let folder of folders) {
      const vocabularyCount = await VocabularyModel.countDocuments({
        folderId: folder._id,
      });
      folder.vocabularyCount = vocabularyCount;
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

// Lấy thông tin chi tiết một thư mục
const getFolderById = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;

    const folder = await FolderModel.findOne({
      _id: folderId,
      userId,
    }).lean();

    if (!folder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục không tồn tại",
      });
    }

    // Thêm số lượng từ vựng
    const vocabularyCount = await VocabularyModel.countDocuments({
      folderId: folder._id,
    });
    folder.vocabularyCount = vocabularyCount;

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

// Cập nhật thư mục
const updateFolder = async (req, res) => {
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
      // Kiểm tra thư mục có tồn tại và thuộc về user không
      folder = await FolderModel.findOne({
        _id: folderId,
        userId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại hoặc không có quyền cập nhật",
        });
      }
    } else {
      // Kiểm tra thư mục có tồn tại và thuộc về user không
      folder = await FolderModel.findOne({
        _id: folderId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại",
        });
      }
    }

    // Kiểm tra tên thư mục mới có trùng với thư mục khác không
    if (name.trim() !== folder.name) {
      const existingFolder = await FolderModel.findOne({
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

    const updatedFolder = await FolderModel.findByIdAndUpdate(
      folderId,
      {
        name: name.trim(),
        description: description || "",
        color: color || folder.color,
      },
      { new: true }
    );

    return res.status(CONSTANT.OK).json({
      message: "Cập nhật thư mục thành công",
      data: updatedFolder,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Xóa thư mục
const deleteFolder = async (req, res) => {
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
      // Kiểm tra thư mục có tồn tại và thuộc về user không
      const folder = await FolderModel.findOne({
        _id: folderId,
        userId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại hoặc không có quyền xóa thư mục này",
        });
      }
    } else {
      // Kiểm tra thư mục có tồn tại và thuộc về user không
      const folder = await FolderModel.findOne({
        _id: folderId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại",
        });
      }
    }

    // Xóa tất cả từ vựng trong thư mục
    await VocabularyModel.deleteMany({ folderId });

    // Xóa thư mục
    await FolderModel.findByIdAndDelete(folderId);

    return res.status(CONSTANT.OK).json({
      message: "Xóa thư mục thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
};
