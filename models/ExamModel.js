const mongoose = require("mongoose");
const ExamSchema = new mongoose.Schema(
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

    numberOfQuestions: {
      type: Number,
      required: true,
    },

    time: {
      type: Number,
      required: true,
    },

    answer: {
      type: Object,
      required: true,
      default: {},
    },

    // startTime: {
    //   type: Date,
    //   required: true,
    // },

    // endTime: {
    //   type: Date,
    //   required: true,
    // },

    questions: {
      type: Array,
      required: true,
      answers: {
        type: Object,
      },
      default: {},
    },
    subject: {
      type: String,
      required: true,
    },
    imgUrl: {
      type: String,
      required: false,
    },
    module: {
      type: String,
      enum: ["MODULE 1", "MODULE 2-EASY", "MODULE 2-DIFFICULT"],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "exams" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
ExamSchema.pre("save", function (next) {
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

ExamSchema.pre("findOneAndUpdate", updateTimestamp);
ExamSchema.pre("updateOne", updateTimestamp);
ExamSchema.pre("updateMany", updateTimestamp);
ExamSchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("Exams", ExamSchema);
