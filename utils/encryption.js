const CryptoJS = require("crypto-js");
const { SECRET_KEY } = require("./constant");

// Khóa bí mật - nên lưu trong biến môi trường (.env)

// Hàm mã hóa dữ liệu
const encryptData = (data) => {
  try {
    // Chuyển đổi dữ liệu thành chuỗi JSON
    const jsonString = JSON.stringify(data);

    // Mã hóa dữ liệu
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();

    return {
      encrypted: true,
      data: encrypted,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

// Export các hàm
module.exports = {
  encryptData,
};
