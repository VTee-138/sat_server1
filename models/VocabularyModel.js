const mongoose = require("mongoose");

const VocabularySchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },
    meaning: {
      type: String,
      required: true,
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
    pronunciation: {
      type: String,
      default: "",
    },
    example: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["not_learned", "learned", "needs_review"],
      required: true,
      default: "not_learned",
    },
    author: {
      type: String,
      default: "user",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "vocabularies" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
VocabularySchema.pre("save", function (next) {
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

VocabularySchema.pre("findOneAndUpdate", updateTimestamp);
VocabularySchema.pre("updateOne", updateTimestamp);
VocabularySchema.pre("updateMany", updateTimestamp);
VocabularySchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("Vocabularies", VocabularySchema);
