const mongoose = require("mongoose");

const FolderQuestionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    color: {
      type: String,
      default: "#3954d9",
    },
    author: {
      type: String,
      default: "user",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "folder_questions" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
FolderQuestionSchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = Date.now();
  }
  this.updatedAt = Date.now();
  next();
});

// Middleware để cập nhật `updatedAt` trước khi update
function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

FolderQuestionSchema.pre("findOneAndUpdate", updateTimestamp);
FolderQuestionSchema.pre("updateOne", updateTimestamp);
FolderQuestionSchema.pre("updateMany", updateTimestamp);
FolderQuestionSchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("FolderQuestions", FolderQuestionSchema);
