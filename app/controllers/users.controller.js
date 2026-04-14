const User = require("../models/User.model");

// GET /users — danh sách tất cả landlord
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /users/:id
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /users
exports.create = async (req, res) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    const { passwordHash, ...result } = saved.toObject();
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }
    res.status(400).json({ message: err.message });
  }
};

// PUT /users/:id
exports.update = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");
    if (!updated) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /users/:id
exports.remove = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ message: "Đã xóa user" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
