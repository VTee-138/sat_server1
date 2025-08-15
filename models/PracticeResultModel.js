const mongoose = require("mongoose");
const PracticeResultSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      ref: "QuestionBanks",
      index: true,
      unique: true,
    },

    userId: {
      type: String,
      required: true,
      ref: "Users",
      index: true,
    },

    isCorrect: {
      type: Boolean,
      required: true,
    },

    status: {
      type: String,
      enum: ["need_to_review", "learned"],
      default: "need_to_review",
    },

    userAnswer: {
      type: String,
      required: true,
    },

    note: {
      type: String,
      default: "",
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "practice_results" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
PracticeResultSchema.pre("save", function (next) {
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

PracticeResultSchema.pre("findOneAndUpdate", updateTimestamp);
PracticeResultSchema.pre("updateOne", updateTimestamp);
PracticeResultSchema.pre("updateMany", updateTimestamp);
PracticeResultSchema.pre("findByIdAndUpdate", updateTimestamp);

PracticeResultSchema.index({ questionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("PracticeResults", PracticeResultSchema);
