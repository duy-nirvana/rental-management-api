const Invoice = require("../models/Invoice.model");
const Room = require("../models/Room.model");

// Tính subtotal và totalAmount từ body
function computeTotals(data) {
  const electricityAmount = data.electricity?.amount ?? 0;
  const waterAmount = data.water?.amount ?? 0;
  const garbageFee = data.garbageFee ?? 0;
  const internetFee = data.internetFee ?? 0;
  const parkingFee = data.parkingFee ?? 0;
  const otherFixed = (data.otherFixedFees ?? []).reduce((s, f) => s + (f.amount ?? 0), 0);

  const subtotal =
    (data.rentAmount ?? 0) +
    electricityAmount +
    waterAmount +
    garbageFee +
    internetFee +
    parkingFee +
    otherFixed;

  const surchargesTotal = (data.surcharges ?? []).reduce((s, c) => s + (c.amount ?? 0), 0);
  const totalAmount = subtotal + surchargesTotal;

  return { subtotal, totalAmount };
}

// GET /invoices — lọc theo room, landlord, status
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.room) filter.room = req.query.room;
    if (req.query.landlord) filter.landlord = req.query.landlord;
    if (req.query.status) filter.status = req.query.status;

    const invoices = await Invoice.find(filter)
      .populate("room", "name floor")
      .populate("landlord", "fullName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /invoices/:id
exports.getById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("room")
      .populate("landlord", "-passwordHash")
      .lean();
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /invoices — tạo hóa đơn mới
// Nếu không truyền electricity.amount / water.amount thì tự tính từ chỉ số và đơn giá
exports.create = async (req, res) => {
  try {
    const body = req.body;

    // Tự động tính tiền điện nước nếu chưa truyền amount
    if (body.electricity && body.electricity.amount === undefined) {
      const usage = body.electricity.currentReading - body.electricity.previousReading;
      body.electricity.amount = usage * body.electricity.unitPrice;
    }
    if (body.water && body.water.amount === undefined) {
      const usage = body.water.currentReading - body.water.previousReading;
      body.water.amount = usage * body.water.unitPrice;
    }

    // Snapshot phí cố định từ phòng nếu client không truyền
    if (!body.rentAmount || !body.electricity || !body.water) {
      const room = await Room.findById(body.room);
      if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

      body.rentAmount = body.rentAmount ?? room.rentPrice;
      body.garbageFee = body.garbageFee ?? room.garbageFee;
      body.internetFee = body.internetFee ?? room.internetFee;
      body.parkingFee = body.parkingFee ?? room.parkingFee;
      body.otherFixedFees = body.otherFixedFees ?? room.otherFixedFees.filter((f) => f.isActive);

      if (!body.electricity) {
        body.electricity = {
          previousReading: 0,
          currentReading: 0,
          unitPrice: room.electricityRate,
          amount: 0,
        };
      }
      if (!body.water) {
        body.water = {
          previousReading: 0,
          currentReading: 0,
          unitPrice: room.waterRate,
          amount: 0,
        };
      }
    }

    const { subtotal, totalAmount } = computeTotals(body);
    const invoice = new Invoice({ ...body, subtotal, totalAmount });
    const saved = await invoice.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /invoices/:id — cập nhật hóa đơn (chỉ khi còn ở trạng thái draft)
exports.update = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    if (invoice.status === "paid") {
      return res.status(400).json({ message: "Không thể chỉnh sửa hóa đơn đã thanh toán" });
    }

    Object.assign(invoice, req.body);
    const { subtotal, totalAmount } = computeTotals(invoice.toObject());
    invoice.subtotal = subtotal;
    invoice.totalAmount = totalAmount;

    const saved = await invoice.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH /invoices/:id/status — đổi trạng thái (sent, paid, overdue)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "sent", "paid", "overdue"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    invoice.status = status;
    if (status === "paid" && !invoice.paidAt) {
      invoice.paidAt = req.body.paidAt || new Date();
    }
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /invoices/:id — chỉ xóa được khi draft
exports.remove = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    if (invoice.status !== "draft") {
      return res.status(400).json({ message: "Chỉ có thể xóa hóa đơn ở trạng thái draft" });
    }

    await invoice.deleteOne();
    res.json({ message: "Đã xóa hóa đơn" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
