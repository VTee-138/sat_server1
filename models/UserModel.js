const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },

    password: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    role: {
      type: Number,
      required: true,
      default: 0,
    },

    expireAt: {
      type: Date,
      required: true,
    },
    school: { type: String, default: "" },
    phone: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "users" }
);

// TTL index
UserSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// Middleware để cập nhật `updatedAt` trước khi lưu mới
UserSchema.pre("save", function (next) {
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

UserSchema.pre("findOneAndUpdate", updateTimestamp);
UserSchema.pre("updateOne", updateTimestamp);
UserSchema.pre("updateMany", updateTimestamp);
UserSchema.pre("findByIdAndUpdate", updateTimestamp);

module.exports = mongoose.model("Users", UserSchema);
