const Tenant = require("../models/Tenant.model");
const Room = require("../models/Room.model");

// GET /tenants — danh sách người lưu trú, lọc theo phòng hoặc trạng thái
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.room) filter.currentRoom = req.query.room;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const tenants = await Tenant.find(filter).populate("currentRoom").lean();
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /tenants/:id
exports.getById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate("currentRoom").lean();
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy người lưu trú" });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /tenants — thêm người lưu trú (có thể kèm nhận phòng)
exports.create = async (req, res) => {
  try {
    const { currentRoom, ...rest } = req.body;

    // Nếu được gán vào phòng, kiểm tra phòng tồn tại
    if (currentRoom) {
      const room = await Room.findById(currentRoom);
      if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const tenant = new Tenant({ ...rest, currentRoom: currentRoom || null });
    const saved = await tenant.save();

    // Cập nhật trạng thái phòng thành occupied nếu chưa
    if (currentRoom) {
      await Room.findByIdAndUpdate(currentRoom, { status: "occupied" });
    }

    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "CMND/CCCD đã tồn tại" });
    }
    res.status(400).json({ message: err.message });
  }
};

// PUT /tenants/:id
exports.update = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy người lưu trú" });

    const { currentRoom: newRoom, ...rest } = req.body;
    const oldRoom = tenant.currentRoom?.toString();

    // Kiểm tra phòng mới nếu có thay đổi
    if (newRoom !== undefined && newRoom !== null && newRoom !== oldRoom) {
      const room = await Room.findById(newRoom);
      if (!room) return res.status(404).json({ message: "Không tìm thấy phòng mới" });
    }

    Object.assign(tenant, rest);
    if (newRoom !== undefined) tenant.currentRoom = newRoom || null;
    const saved = await tenant.save();

    // Cập nhật trạng thái phòng
    if (newRoom && newRoom !== oldRoom) {
      await Room.findByIdAndUpdate(newRoom, { status: "occupied" });
    }
    if (oldRoom && (!newRoom || newRoom !== oldRoom)) {
      const stillOccupied = await Tenant.exists({
        currentRoom: oldRoom,
        isActive: true,
        _id: { $ne: tenant._id },
      });
      if (!stillOccupied) {
        await Room.findByIdAndUpdate(oldRoom, { status: "available" });
      }
    }

    res.json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "CMND/CCCD đã tồn tại" });
    }
    res.status(400).json({ message: err.message });
  }
};

// POST /tenants/:id/checkout — trả phòng
exports.checkout = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy người lưu trú" });
    if (!tenant.currentRoom)
      return res.status(400).json({ message: "Người này hiện không ở phòng nào" });

    const roomId = tenant.currentRoom.toString();
    tenant.moveOutDate = req.body.moveOutDate || new Date();
    tenant.currentRoom = null;
    tenant.isActive = false;
    await tenant.save();

    // Nếu phòng không còn ai thì chuyển về available
    const stillOccupied = await Tenant.exists({ currentRoom: roomId, isActive: true });
    if (!stillOccupied) {
      await Room.findByIdAndUpdate(roomId, { status: "available" });
    }

    res.json({ message: "Trả phòng thành công", tenant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /tenants/:id
exports.remove = async (req, res) => {
  try {
    const deleted = await Tenant.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy người lưu trú" });
    res.json({ message: "Đã xóa người lưu trú" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
