const mongoose = require("mongoose");

const ErrorLogSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },
    questionData: {
      type: Object,
      required: true,
      examId: {
        type: String,
        required: true,
      },
      questionNumber: {
        type: String,
        required: true,
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
      module: {
        type: String,
        required: true,
      },
      section: {
        type: String,
        required: true,
      },
      correctAnswer: {
        type: String,
        required: true,
      },
      yourAnswer: {
        type: String,
        required: true,
      },
      question: {
        type: Object,
        required: true,
      },
      default: {},
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folders",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    status: {
      type: String,
      enum: ["learned", "needs_review"],
      required: true,
      default: "needs_review",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "error_logs" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
ErrorLogSchema.pre("save", function (next) {
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

ErrorLogSchema.pre("findOneAndUpdate", updateTimestamp);
ErrorLogSchema.pre("updateOne", updateTimestamp);
ErrorLogSchema.pre("updateMany", updateTimestamp);
ErrorLogSchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("ErrorLogs", ErrorLogSchema);
