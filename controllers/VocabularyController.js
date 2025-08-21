const VocabularyModel = require("../models/VocabularyModel.js");
const FolderModel = require("../models/FolderModel.js");
const UserModel = require("../models/UserModel.js");
const CONSTANT = require("../utils/constant.js");
const { encryptData } = require("../utils/encryption.js");
const { default: mongoose } = require("mongoose");
const XLSX = require("xlsx");

// Tạo từ vựng mới
const createVocabulary = async (req, res) => {
  try {
    const {
      word,
      meaning,
      context,
      folderId,
      pronunciation,
      example,
      difficulty,
      tags,
    } = req.body;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    if (!word || word.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Từ vựng không được để trống",
      });
    }

    if (!meaning || meaning.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Nghĩa của từ không được để trống",
      });
    }

    if (!folderId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Vui lòng chọn thư mục",
      });
    }

    // Kiểm tra thư mục có tồn tại và thuộc về user không
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      let folder = await FolderModel.findOne({
        _id: folderId,
        userId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message:
            "Thư mục không tồn tại hoặc không có quyền tạo từ vựng trong thư mục này",
        });
      }
    } else {
      let folder = await FolderModel.findOne({
        _id: folderId,
      });

      if (!folder) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Thư mục không tồn tại",
        });
      }
    }

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục không tồn tại",
      });
    }

    // Kiểm tra từ vựng đã tồn tại trong thư mục chưa
    const existingVocabulary = await VocabularyModel.findOne({
      word: word.trim().toLowerCase(),
      folderId,
      userId,
    });

    if (existingVocabulary) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Vocabulary already exists in this folder",
      });
    }

    const vocabulary = new VocabularyModel({
      word: word.trim().toLowerCase(),
      meaning: meaning.trim(),
      context: context || "",
      folderId,
      userId,
      pronunciation: pronunciation || "",
      example: example || "",
      difficulty: difficulty || 3,
      tags: tags || [],
      author: user.role === 1 ? "admin" : "user",
    });

    await vocabulary.save();

    // Populate folder info
    await vocabulary.populate("folderId", "name color");

    return res.status(CONSTANT.OK).json({
      message: "Thêm từ vựng thành công",
      data: vocabulary,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy danh sách từ vựng
const getVocabularies = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, folderId, search } = req.query;
    const skip = (page - 1) * limit;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    let filter = {};
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      filter = {
        $or: [{ userId }, { author: "admin" }],
      };
    }

    // Lọc theo thư mục
    if (folderId) {
      filter.folderId = folderId;
    }

    // Tìm kiếm theo từ hoặc nghĩa
    if (search) {
      filter.$or = [
        { word: { $regex: search.trim(), $options: "i" } },
        { meaning: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const totalItems = await VocabularyModel.countDocuments(filter);
    let vocabularies = [];
    if (limit === "all") {
      vocabularies = await VocabularyModel.find(filter)
        .populate("folderId", "name color")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      vocabularies = await VocabularyModel.find(filter)
        .populate("folderId", "name color")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: vocabularies,
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

// Lấy thông tin chi tiết một từ vựng
const getVocabularyById = async (req, res) => {
  try {
    const { vocabularyId } = req.params;
    const userId = req.user?.id;

    const vocabulary = await VocabularyModel.findOne({
      _id: vocabularyId,
      userId,
    })
      .populate("folderId", "name color")
      .lean();

    if (!vocabulary) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Từ vựng không tồn tại",
      });
    }

    return res.status(CONSTANT.OK).json({
      data: vocabulary,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Cập nhật từ vựng
const updateVocabulary = async (req, res) => {
  try {
    const { vocabularyId } = req.params;
    const {
      word,
      meaning,
      context,
      folderId,
      pronunciation,
      example,
      difficulty,
      tags,
      status,
    } = req.body;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    if (!word || word.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Từ vựng không được để trống",
      });
    }

    if (!meaning || meaning.trim() === "") {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Nghĩa của từ không được để trống",
      });
    }
    if (user.role !== CONSTANT.ADMIN_ROLE) {
      // Kiểm tra từ vựng có tồn tại và thuộc về user không
      const vocabulary = await VocabularyModel.findOne({
        _id: vocabularyId,
        userId,
      });

      if (!vocabulary) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Từ vựng không tồn tại hoặc không có quyền cập nhật",
        });
      }
    } else {
      // Kiểm tra từ vựng có tồn tại và thuộc về user không
      const vocabulary = await VocabularyModel.findOne({
        _id: vocabularyId,
      });

      if (!vocabulary) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Từ vựng không tồn tại",
        });
      }
    }

    if (
      !status ||
      !["not_learned", "learned", "needs_review"].includes(status)
    ) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: not_learned, learned, needs_review",
      });
    }

    const updatedVocabulary = await VocabularyModel.findByIdAndUpdate(
      vocabularyId,
      {
        ...req.body,
        word: word.trim().toLowerCase(),
        meaning: meaning.trim(),
      },
      { new: true }
    ).populate("folderId", "name color");

    return res.status(CONSTANT.OK).json({
      message: "Cập nhật từ vựng thành công",
      data: updatedVocabulary,
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Xóa từ vựng
const deleteVocabulary = async (req, res) => {
  try {
    const { vocabularyId } = req.params;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      // Kiểm tra từ vựng có tồn tại và thuộc về user không
      const vocabulary = await VocabularyModel.findOne({
        _id: vocabularyId,
        userId,
      });

      if (!vocabulary) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Từ vựng không tồn tại hoặc không có quyền xóa từ vựng này",
        });
      }
    } else {
      // Kiểm tra từ vựng có tồn tại và thuộc về user không
      const vocabulary = await VocabularyModel.findOne({
        _id: vocabularyId,
      });

      if (!vocabulary) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Từ vựng không tồn tại",
        });
      }
    }

    await VocabularyModel.findByIdAndDelete(vocabularyId);

    return res.status(CONSTANT.OK).json({
      message: "Xóa từ vựng thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Lấy từ vựng theo thư mục
const getVocabulariesByFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    // Kiểm tra thư mục có tồn tại và thuộc về user không
    const folder = await FolderModel.findOne({
      _id: folderId,
      $or: [{ userId }, { author: "admin" }],
    });

    if (!folder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục không tồn tại",
      });
    }

    let filter = { folderId, userId };

    // Tìm kiếm theo từ hoặc nghĩa
    if (search) {
      filter.$or = [
        { word: { $regex: search, $options: "i" } },
        { meaning: { $regex: search, $options: "i" } },
      ];
    }

    const totalItems = await VocabularyModel.countDocuments(filter);
    const vocabularies = await VocabularyModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: vocabularies,
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

// Cập nhật trạng thái học từ vựng
const updateVocabularyStatus = async (req, res) => {
  try {
    const { vocabularyId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }
    if (!vocabularyId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "ID từ vựng không được để trống",
      });
    }

    if (
      !status ||
      !["not_learned", "learned", "needs_review"].includes(status)
    ) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: not_learned, learned, needs_review",
      });
    }

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      // Kiểm tra từ vựng có tồn tại và thuộc về user không
      const vocabulary = await VocabularyModel.findOne({
        _id: vocabularyId,
        userId,
      });

      if (!vocabulary) {
        return res.status(CONSTANT.OK).json({
          message: "Từ vựng không tồn tại hoặc không có quyền cập nhật",
        });
      }
    } else {
      // Kiểm tra từ vựng có tồn tại và thuộc về user không
      const vocabulary = await VocabularyModel.findOne({
        _id: vocabularyId,
      });

      if (!vocabulary) {
        return res.status(CONSTANT.OK).json({
          message: "Từ vựng không tồn tại",
        });
      }
    }

    if (status === "learned") {
      await VocabularyModel.deleteOne({
        _id: vocabularyId,
        userId,
      });
      return res.status(CONSTANT.OK).json({
        message: "Từ vựng đã thuộc được xóa khỏi thư mục",
      });
    }

    const updatedVocabulary = await VocabularyModel.findByIdAndUpdate(
      vocabularyId,
      { status },
      { new: true }
    );

    res.status(CONSTANT.OK).json({
      message: "Cập nhật trạng thái thành công",
      data: {
        vocabulary: encryptData(updatedVocabulary),
      },
    });
  } catch (error) {
    console.error("Error updating vocabulary status:", error);
    res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Import từ vựng từ file Excel
const importVocabulariesFromExcel = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { folderId } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Người dùng không tồn tại",
      });
    }

    if (!folderId) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Vui lòng chọn thư mục",
      });
    }

    // Kiểm tra thư mục có tồn tại không
    const folder = await FolderModel.findById(folderId);
    if (!folder) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Thư mục không tồn tại",
      });
    }

    if (!req.file) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "Vui lòng chọn file Excel để import",
      });
    }

    // Đọc file Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển đổi sheet thành JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: "File Excel phải có ít nhất 2 dòng (header + data)",
      });
    }

    // Lấy header row (dòng đầu tiên)
    const headers = jsonData[0];

    // Kiểm tra các cột bắt buộc
    const requiredColumns = ["Từ vựng", "Nghĩa"];
    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return res.status(CONSTANT.BAD_REQUEST).json({
        message: `File Excel thiếu các cột bắt buộc: ${missingColumns.join(
          ", "
        )}`,
      });
    }

    // Tìm index của các cột
    const wordIndex = headers.indexOf("Từ vựng");
    const meaningIndex = headers.indexOf("Nghĩa");
    const pronunciationIndex = headers.indexOf("Phát âm");
    const exampleIndex = headers.indexOf("Ví dụ");
    const statusIndex = headers.indexOf("Trạng thái");

    const vocabularies = [];
    const errors = [];
    const existingWords = [];

    // Xử lý từng dòng data (bỏ qua header)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip empty rows
      if (!row || row.length === 0 || !row[wordIndex] || !row[meaningIndex]) {
        continue;
      }

      const word = row[wordIndex]?.toString().trim().toLowerCase();
      const meaning = row[meaningIndex]?.toString().trim();
      const pronunciation =
        pronunciationIndex >= 0
          ? row[pronunciationIndex]?.toString().trim() || ""
          : "";
      const example =
        exampleIndex >= 0 ? row[exampleIndex]?.toString().trim() || "" : "";
      const statusValue =
        statusIndex >= 0
          ? row[statusIndex]?.toString().trim() || "not_learned"
          : "not_learned";

      // Validate status
      const validStatuses = ["not_learned", "learned", "needs_review"];
      const status = validStatuses.includes(statusValue)
        ? statusValue
        : "not_learned";

      if (!word || !meaning) {
        errors.push(`Dòng ${i + 1}: Thiếu từ vựng hoặc nghĩa`);
        continue;
      }

      // Kiểm tra từ vựng đã tồn tại chưa
      const existingVocabulary = await VocabularyModel.findOne({
        word: word,
        folderId: folderId,
        userId: userId,
      });

      if (existingVocabulary) {
        existingWords.push(word);
        continue;
      }

      vocabularies.push({
        word: word,
        meaning: meaning,
        pronunciation: pronunciation,
        example: example,
        folderId: folderId,
        userId: userId,
        status: status,
        author: user.role === CONSTANT.ADMIN_ROLE ? "admin" : "user",
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Bulk insert vocabularies
    if (vocabularies.length > 0) {
      try {
        const insertedVocabularies = await VocabularyModel.insertMany(
          vocabularies
        );
        successCount = insertedVocabularies.length;
      } catch (error) {
        console.error("Error inserting vocabularies:", error);
        failCount = vocabularies.length;
        errors.push("Lỗi khi lưu từ vựng vào database");
      }
    }

    return res.status(CONSTANT.OK).json({
      message: "Import từ vựng hoàn tất",
      data: {
        successCount: successCount,
        failCount: failCount,
        existingCount: existingWords.length,
        errors: errors,
        existingWords: existingWords.slice(0, 10), // Chỉ hiển thị 10 từ đầu tiên
        totalProcessed: jsonData.length - 1, // Trừ header row
      },
    });
  } catch (error) {
    console.error("Error importing vocabularies:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi khi import từ vựng: " + error.message,
    });
  }
};

module.exports = {
  createVocabulary,
  getVocabularies,
  getVocabularyById,
  updateVocabulary,
  deleteVocabulary,
  getVocabulariesByFolder,
  updateVocabularyStatus,
  importVocabulariesFromExcel,
};
