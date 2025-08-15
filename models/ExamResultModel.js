const mongoose = require("mongoose");
const ExamResultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "Users",
    },
    assessmentId: {
      type: String,
      required: true,
      ref: "Assessments",
    },
    totalNumberOfCorrectAnswers: {
      type: Object,
      default: {
        "TIẾNG ANH": {
          "MODULE 1": 0,
          "MODULE 2": 0,
        },
        TOÁN: {
          "MODULE 1": 0,
          "MODULE 2": 0,
        },
      },
    },
    cacheTotalScore: {
      type: Object,
      default: {
        "TIẾNG ANH": 0,
        TOÁN: 0,
      },
    },
    totalScore: {
      type: Object,
      required: true,
      default: {
        "TIẾNG ANH": 0,
        TOÁN: 0,
      },
    },
    modules: {
      type: Object,
      required: true,
      default: {
        "TIẾNG ANH": [],
        TOÁN: [],
      },
    },
    userAnswers: {
      type: Object,
      required: true,
      default: {},
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "exam_results" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
ExamResultSchema.pre("save", function (next) {
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

ExamResultSchema.pre("findOneAndUpdate", updateTimestamp);
ExamResultSchema.pre("updateOne", updateTimestamp);
ExamResultSchema.pre("updateMany", updateTimestamp);
ExamResultSchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("ExamResults", ExamResultSchema);
