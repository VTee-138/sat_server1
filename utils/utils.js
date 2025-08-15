const gradeQuizExams = (
  userAnswers,
  correctAnswers,
  module,
) => {
  const moduleName = module.split("-")[0];
  let numberOfCorrectAnswers = 0;
  if (
    Object.keys(correctAnswers || {}).length === 0 ||
    Object.keys(userAnswers || {}).length === 0
  ) {
    return { [`${moduleName}`]: 0 };
  }

  Object.keys(correctAnswers).forEach((question) => {
    const correctAnswer = correctAnswers[question];
    const userAnswer = userAnswers[question];
    if (typeof correctAnswer === "string") {
      if (correctAnswer === userAnswer) {
        numberOfCorrectAnswers++;
      }
    } else if (Array.isArray(correctAnswer)) {
      if (
        correctAnswer.includes(
          isNumeric(userAnswer) ? parseFloat(userAnswer) : userAnswer
        )
      ) {
        numberOfCorrectAnswers++;
      }
    }
  });

  return {
    [`${moduleName}`]: numberOfCorrectAnswers,
  };
};

const checkCorrectAnswersUser = (userAnswers, correctAnswers) => {
  let answers = {};
  Object.keys(correctAnswers).forEach((question) => {
    const correctAnswer = correctAnswers ? correctAnswers[question] : null;
    const userAnswer = userAnswers ? userAnswers[question] : "";
    if (typeof correctAnswer === "string") {
      if (correctAnswer === userAnswer) {
        answers = { ...answers, [`${question}`]: true };
      } else {
        answers = { ...answers, [`${question}`]: false };
      }
    } else if (Array.isArray(correctAnswer)) {
      if (correctAnswer.includes(userAnswer)) {
        answers = { ...answers, [`${question}`]: true };
      } else {
        answers = { ...answers, [`${question}`]: false };
      }
    }
  });

  return answers;
};

const parseBasicAuthHeader = (req) => {
  // Lấy header Authorization
  const authHeader = req.headers.authorization;

  // Kiểm tra nếu header không tồn tại hoặc không bắt đầu bằng "Basic"
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null; // Không có thông tin xác thực
  }

  // Lấy phần mã hóa Base64 từ header
  const base64Credentials = authHeader.split(" ")[1];

  // Giải mã chuỗi Base64
  const decodedCredentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8"
  );

  // Tách username và password từ chuỗi giải mã
  const [username, password] = decodedCredentials.split(":");

  // Trả về username và password (hoặc null nếu không hợp lệ)
  if (!username || !password) {
    return null;
  }

  return { username, password };
};

const isNumeric = (numericValue) => {
  if (numericValue === 0 || numericValue === "0") return true;
  if (!numericValue) return false;
  if (typeof numericValue === "string" && numericValue.includes(",")) {
    numericValue = numericValue.replace(",", ".");
  }

  return !isNaN(numericValue) && !isNaN(parseFloat(numericValue));
};

function normalizeModules(existingModules = [], newModule = "") {
  const result = [...existingModules, newModule];

  // Lọc MODULE 2- prefix
  const module2s = result.filter((m) => m.startsWith("MODULE 2"));

  if (module2s.length > 1) {
    // Xác định cái nào cần giữ (ưu tiên cái sau)
    const moduleToKeep = module2s[module2s.length - 1];
    const filtered = result.filter(
      (m, idx) =>
        !m.startsWith("MODULE 2") ||
        m === moduleToKeep ||
        result.lastIndexOf(m) !== idx
    );
    return [...new Set(filtered)]; // lọc trùng cuối
  }

  return [...new Set(result)];
}
function roundToNearestTen(num) {
  return Math.round(num / 10) * 10;
}
function getClientIp(req) {
  const ip = req.ip || req.connection.remoteAddress || "";
  return ip === "::1" ? "127.0.0.1" : ip;
}

function toLowerCaseNonAccentVietnamese(str) {
  str = str.toLowerCase();
  str = str.replaceAll(";", "_");
  //     We can also use this instead of from line 11 to line 17
  //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
  //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
  //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
  //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
  //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
  //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
  //     str = str.replace(/\u0111/g, "d");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
  str = str.replaceAll(" ", "_");
  return str;
}

// This function keeps the casing unchanged for str, then perform the conversion
function toNonAccentVietnamese(str) {
  str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/đ/g, "d");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
  return str;
}
// Helper function để chuẩn hóa contentQuestion
const normalizeContentQuestion = (content) => {
  content = removeHTMLTags(content);
  console.log("🚀 ~ normalizeContentQuestion ~ content:", content);
  return content
    .trim()
    .replace(/\s+/g, " ") // Thay thế nhiều dấu cách bằng 1 dấu cách
    .toLowerCase(); // Chuyển về lowercase để so sánh không phân biệt hoa thường
};

function removeHTMLTags(input) {
  return input.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}
module.exports = {
  normalizeContentQuestion,
  removeHTMLTags,
  isNumeric,
  toLowerCaseNonAccentVietnamese,
  getClientIp,
  roundToNearestTen,
  gradeQuizExams,
  checkCorrectAnswersUser,
  parseBasicAuthHeader,
  normalizeModules,
};
