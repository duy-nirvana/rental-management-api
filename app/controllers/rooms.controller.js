const Room = require("../models/Room.model");
const Tenant = require("../models/Tenant.model");

// GET /rooms — lấy tất cả phòng, có thể lọc theo landlord
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.landlord) filter.landlord = req.query.landlord;
    if (req.query.status) filter.status = req.query.status;

    const rooms = await Room.find(filter).populate("landlord", "-passwordHash").lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /rooms/:id — chi tiết phòng kèm danh sách người ở
exports.getById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("landlord", "-passwordHash").lean();
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    const tenants = await Tenant.find({ currentRoom: room._id, isActive: true }).lean();
    res.json({ ...room, tenants });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /rooms
exports.create = async (req, res) => {
  try {
    const room = new Room(req.body);
    const saved = await room.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /rooms/:id
exports.update = async (req, res) => {
  try {
    const updated = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /rooms/:id
exports.remove = async (req, res) => {
  try {
    // Không cho xóa nếu còn người đang ở
    const occupied = await Tenant.exists({ currentRoom: req.params.id, isActive: true });
    if (occupied) {
      return res.status(400).json({ message: "Phòng còn người đang ở, không thể xóa" });
    }

    const deleted = await Room.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json({ message: "Đã xóa phòng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
