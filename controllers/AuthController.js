const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/UserModel.js");
// var sliderCaptcha = require("@slider-captcha/core");
// const redis = require("../config/redis.js");
const CONSTANT = require("../utils/constant.js");
const { v4: uuidv4 } = require("uuid");
const { encryptData } = require("../utils/encryption.js");

// Hàm đăng nhập
const login = async (req, res) => {
  try {
    let { email, password, captchaToken, captchaUuid } = req.body;

    // if (!captchaToken) {
    //   return res
    //     .status(CONSTANT.BAD_REQUEST)
    //     .json({ message: "Vui lòng điền thông tin captchaToken" });
    // }

    // if (!captchaUuid) {
    //   return res
    //     .status(CONSTANT.BAD_REQUEST)
    //     .json({ message: "Vui lòng điền thông tin captchaUuid" });
    // }

    if (!email) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin email" });
    }

    if (!password) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin password" });
    }

    // const token = await redis.get(`captcha-token_${captchaUuid}`);

    // if (!token || token !== captchaToken) {
    //   return res
    //     .status(CONSTANT.UNAUTHORIZED)
    //     .send({ message: "Invalid CAPTCHA token!" });
    // }

    email = email?.toLowerCase()?.trim();

    let user = await User.findOne({
      email,
    });

    if (!user) {
      return res
        .status(CONSTANT.UNAUTHORIZED)
        .json({ message: "Email không hợp lệ" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(CONSTANT.UNAUTHORIZED)
        .json({ message: "Mật khẩu không hợp lệ" });
    }

    // Tạo JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Tạo JWT token và trả về cho người dùng
    jwt.sign(
      payload,
      CONSTANT.JWT_SECRET,
      {
        expiresIn: CONSTANT.EXPIRESIN,
      },
      (err, token) => {
        if (err) {
          return res
            .status(CONSTANT.UNAUTHORIZED)
            .json({ message: "Error signing token", raw: err });
        }
        res.json(
          encryptData({ token, username: user?.fullName, email: user?.email })
        );
      }
    );
  } catch (error) {
    console.error(error.message);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin email" });
    }

    if (!password) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin password" });
    }

    email = email?.toLowerCase()?.trim();

    let user = await User.findOne({
      email,
    });

    if (!user) {
      return res
        .status(CONSTANT.UNAUTHORIZED)
        .json({ message: "Email hoặc Username không hợp lệ" });
    }

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res
        .status(CONSTANT.UNAUTHORIZED)
        .json({ message: "Bạn không có quyền đăng nhập vào hệ thống" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(CONSTANT.UNAUTHORIZED)
        .json({ message: "Mật khẩu không hợp lệ" });
    }

    // Tạo JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Tạo JWT token và trả về cho người dùng
    jwt.sign(
      payload,
      CONSTANT.JWT_SECRET,
      {
        expiresIn: CONSTANT.EXPIRESIN,
      },
      (err, token) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error signing token", raw: err });
        }
        res.json(encryptData({ token }));
      }
    );
  } catch (error) {
    console.error(error.message);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

// const createCaptcha = async (req, res) => {
//   try {
//     sliderCaptcha.create().then(async function ({ data, solution }) {
//       const captcha_uuid = uuidv4();
//       await redis.set(`captcha_${captcha_uuid}`, solution, "EX", 60 * 5);
//       // req.session.captcha = solution;
//       // req.session.save();
//       return res.status(CONSTANT.OK).send({ captcha_uuid, data });
//     });
//   } catch (error) {
//     console.error(error.message);
//     return res
//       .status(CONSTANT.INTERNAL_SERVER_ERROR)
//       .send({ message: error.message });
//   }
// };

// const verifyCaptcha = async (req, res) => {
//   try {
//     const { captchaUuid, response, trail } = req.body;
//     const captcha = await redis.get(`captcha_${captchaUuid}`);
//     sliderCaptcha
//       .verify(captcha, { response, trail })
//       .then(async function (verification) {
//         if (verification.result === "success") {
//           await redis.set(
//             `captcha-token_${captchaUuid}`,
//             verification.token,
//             "EX",
//             60 * 5
//           );
//           // req.session.token = verification.token;
//           // req.session.save();
//         }
//         return res.status(CONSTANT.OK).send(verification);
//       });
//   } catch (error) {
//     console.error(error.message);
//     return res
//       .status(CONSTANT.INTERNAL_SERVER_ERROR)
//       .send({ message: error.message });
//   }
// };
module.exports = { login, loginAdmin };
