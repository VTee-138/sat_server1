const { parseBasicAuthHeader } = require("../utils/utils");
const CONSTANT = require("../utils/constant.js");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res
      .status(CONSTANT.UNAUTHORIZED)
      .json({ message: "Truy cập bị từ chối. Không cung cấp mã token" });

  try {
    const decoded = jwt.verify(token, CONSTANT.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error(error.message);
    return res
      .status(CONSTANT.UNAUTHORIZED)
      .send({ message: "Mã token không hợp lệ" });
  }
};

const verifyTokenExam = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    req.user = null;
  }
  try {
    const decoded = jwt.verify(token, CONSTANT.JWT_SECRET);
    req.user = decoded.user;
  } catch (error) {
    req.user = null;
  } finally {
    next();
  }
};

// Middleware kiểm tra Basic Auth
const verifyBasicAuth = (req, res, next) => {
  try {
    const credentials = parseBasicAuthHeader(req);

    if (!credentials) {
      return res
        .status(CONSTANT.UNAUTHORIZED)
        .json({ message: "Unauthorized: Invalid or missing credentials" });
    }

    // Kiểm tra username và password (thay bằng logic thực tế của bạn)
    if (
      credentials.username !== CONSTANT.AUTH_USERNAME &&
      credentials.password !== CONSTANT.AUTH_PASSWORD
    ) {
      return res
        .status(CONSTANT.FORBIDDEN)
        .json({ message: "Forbidden: Invalid credentials" });
    }

    // Nếu thông tin hợp lệ, cho phép tiếp tục
    next();
  } catch (error) {
    console.error(error.message);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: " Invalid credentials" });
  }
};

module.exports = { verifyToken, verifyBasicAuth, verifyTokenExam };
