const mongoose = require("mongoose");
const AssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: Object,
      text: {
        type: String,
        unique: true,
        required: true,
      },
      code: {
        type: String,
        unique: true,
        required: true,
      },
    },
    childExamIDs: {
      type: Array,
      required: true,
      default: [],
    },
    numberOfTest: {
      type: Number,
      required: true,
      default: 0,
    },
    imgUrl: {
      type: String,
      required: true,
    },
    totalTime: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestion: {
      type: Number,
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "assessments" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
AssessmentSchema.pre("save", function (next) {
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

AssessmentSchema.pre("findOneAndUpdate", updateTimestamp);
AssessmentSchema.pre("updateOne", updateTimestamp);
AssessmentSchema.pre("updateMany", updateTimestamp);
AssessmentSchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("Assessments", AssessmentSchema);
