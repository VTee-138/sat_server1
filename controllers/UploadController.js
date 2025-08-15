const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CONSTANT = require("../utils/constant.js");

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, "../uploads/images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp và extension gốc
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "image-" + uniqueSuffix + ext);
  },
});

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
  // Chỉ cho phép các file ảnh
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file ảnh!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadImage = async (req, res) => {
  try {
    // Multer middleware sẽ xử lý file upload
    upload.single("image")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(CONSTANT.BAD_REQUEST).json({
            message: "File quá lớn! Kích thước tối đa là 5MB.",
            error: err.message,
          });
        }
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Lỗi upload file!",
          error: err.message,
        });
      } else if (err) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: err.message || "Lỗi upload file!",
        });
      }

      // Kiểm tra xem có file được upload không
      if (!req.file) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Không có file nào được chọn!",
        });
      }

      // Tạo URL để truy cập file
      const imageUrl = `/api/v2/uploads/images/${req.file.filename}`;

      return res.status(CONSTANT.OK).json({
        message: "Upload ảnh thành công!",
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          imageUrl: imageUrl,
          imagePath: req.file.path,
        },
      });
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi server khi upload ảnh!",
      error: error.message,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      return res.status(CONSTANT.NOT_FOUND).json({
        message: "File không tồn tại!",
      });
    }

    // Xóa file
    fs.unlinkSync(filePath);

    return res.status(CONSTANT.OK).json({
      message: "Xóa ảnh thành công!",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(CONSTANT.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi server khi xóa ảnh!",
      error: error.message,
    });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
