const UserModel = require("../models/UserModel.js");
const CONSTANT = require("../utils/constant.js");
const bcrypt = require("bcryptjs");
const { encryptData } = require("../utils/encryption.js");
const { default: mongoose } = require("mongoose");
const createUser = async (req, res) => {
  try {
    let { email, password, role, fullName, expireAt, _id } = req.body;
    console.log("🚀 ~ createUser ~ expireAt:", expireAt);
    const userId = req.user?.id;
    let user = await UserModel.findById(userId);

    if (user.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền tạo và cập nhật user",
      });
    }

    if (!email) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin email" });
    }

    if (!CONSTANT.ROLES.includes(role)) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin role" });
    }

    if (!fullName) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin tên người dùng" });
    }

    if (!expireAt) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin ngày hết hạn" });
    }

    user = await UserModel.findById(_id);

    if (user) {
      let body = req.body;
      body.email = email?.toLowerCase()?.trim();
      if (password) {
        body.password = await bcrypt.hash(password, 10);
      }
      user = await UserModel.updateOne(
        { _id: _id },
        {
          ...body,
          expireAt: new Date(
            Date.now() + parseFloat(expireAt) * 24 * 60 * 60 * 1000
          ),
        }
      );
      if (user.modifiedCount === 0) {
        return res.status(CONSTANT.BAD_REQUEST).json({
          message: "Cập nhật user thất bại",
          data: null,
        });
      }
      user = await UserModel.findById(_id);
      return res.status(CONSTANT.OK).json({
        message: "Cập nhật user thành công",
        data: user,
      });
    }

    if (!password) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Vui lòng điền thông tin password" });
    }

    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.email = email?.toLowerCase()?.trim();
    req.body.password = hashedPassword;
    // Tạo người dùng mới
    user = new UserModel({
      ...req.body,
      expireAt: new Date(
        Date.now() + parseFloat(expireAt) * 24 * 60 * 60 * 1000
      ),
    });

    // Lưu người dùng vào cơ sở dữ liệu
    await user.save();
    return res
      .status(CONSTANT.OK)
      .json({ message: "Tạo tài khoản thành công", data: user });
  } catch (error) {
    console.error(error.message);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const updateAccountPremium = async (req, res) => {
  try {
    const { emails } = req.body;
    const data = await UserModel.updateMany(
      { email: { $in: emails } },
      { $set: { premium: true } }
    );
    return res.status(CONSTANT.OK).json({ data });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const activePremium = async (req, res) => {
  try {
    const { premium } = req.body;
    const { userId } = req.params;
    await UserModel.updateOne({ _id: userId }, { $set: { premium } });
    return res
      .status(CONSTANT.OK)
      .json({ message: "Cập nhật tài khoản premium thành công" });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateOnePassword = await UserModel.updateOne(
      { email },
      { password: hashedPassword }
    );
    if (updateOnePassword.modifiedCount === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Thay đổi mật khẩu thất bại" });
    }
    return res
      .status(CONSTANT.OK)
      .json({ message: "Thay đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getUserInfoById = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await UserModel.findById(id, {
      role: 1,
      email: 1,
      fullName: 1,
      school: 1,
    }).lean();
    if (!user) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Người dùng không tồn tại" });
    }

    return res.status(CONSTANT.OK).json({ data: user });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await UserModel.findById(userId);
    if (user?.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền lấy danh sách user",
      });
    }
    const query = req.query.q;
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;
    if (!query) {
      const totalItems = await UserModel.countDocuments();
      let items = await UserModel.find({}, { password: 0 })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();

      return res.status(CONSTANT.OK).json(
        encryptData({
          data: items,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page),
        })
      );
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);
    let countTotalUsers = 0;
    if (isValidObjectId) {
      countTotalUsers = await UserModel.countDocuments({
        $or: [
          { _id: new mongoose.Types.ObjectId(query)() },
          { email: { $regex: query, $options: "i" } },
          { fullName: { $regex: query, $options: "i" } },
          { school: { $regex: query, $options: "i" } },
        ],
      });

      exams = await UserModel.find(
        {
          $or: [
            { _id: new mongoose.Types.ObjectId(query)() },
            { email: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } },
            { school: { $regex: query, $options: "i" } },
          ],
        },
        { password: 0 }
      )
        .sort({ createdAt: -1 })
        .lean();
    } else {
      countTotalUsers = await UserModel.countDocuments({
        $or: [
          { email: { $regex: query, $options: "i" } },
          { fullName: { $regex: query, $options: "i" } },
          { school: { $regex: query, $options: "i" } },
        ],
      });

      exams = await UserModel.find(
        {
          $or: [
            { email: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } },
            { school: { $regex: query, $options: "i" } },
          ],
        },
        { password: 0 }
      )
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: exams,
        countTotalUsers,
        totalPages: Math.ceil(countTotalUsers / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user_id = req.user?.id;
    const user = await UserModel.findById(user_id);
    if (user?.role !== CONSTANT.ADMIN_ROLE) {
      return res.status(CONSTANT.UNAUTHORIZED).json({
        message: "Bạn không có quyền xóa user",
      });
    }
    const dt = await UserModel.deleteOne({ _id: userId });
    if (dt.deletedCount === 0) {
      return res
        .status(CONSTANT.BAD_REQUEST)
        .json({ message: "Xóa user thất bại" });
    }
    return res.status(CONSTANT.OK).json({ message: "Xóa user thành công" });
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const totalUsers = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    return res.status(CONSTANT.OK).json(
      encryptData({
        data: totalUsers,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};

const checkPremium = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const user = await UserModel.findById(user_id);
    if (!user || !user.premium) {
      return res.status(CONSTANT.OK).json(
        encryptData({
          data: false,
        })
      );
    }

    return res.status(CONSTANT.OK).json(
      encryptData({
        data: true,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(CONSTANT.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
};
module.exports = {
  createUser,
  updateAccountPremium,
  updatePassword,
  getUserInfoById,
  getUsers,
  deleteUser,
  totalUsers,
  checkPremium,
  activePremium,
};
