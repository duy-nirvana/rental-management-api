const mongoose = require("mongoose");
const { Schema } = mongoose;

// Phí phát sinh tùy ý: có thể dương (phụ thu) hoặc âm (giảm trừ)
const surchargeSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true }, // âm = giảm trừ
  },
  { _id: false },
);

// Snapshot phí cố định khác tại thời điểm lập hóa đơn
const feeLineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ---- Kỳ thanh toán ----
    billingPeriod: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },

    // ---- Tiền phòng ----
    rentAmount: { type: Number, required: true, min: 0 },

    // ---- Điện ----
    electricity: {
      previousReading: { type: Number, required: true, min: 0 }, // chỉ số cũ (kWh)
      currentReading: { type: Number, required: true, min: 0 }, // chỉ số mới (kWh)
      unitPrice: { type: Number, required: true, min: 0 }, // VNĐ/kWh
      amount: { type: Number, required: true, min: 0 }, // = (current - previous) * unitPrice
    },

    // ---- Nước ----
    water: {
      previousReading: { type: Number, required: true, min: 0 }, // chỉ số cũ (m³)
      currentReading: { type: Number, required: true, min: 0 }, // chỉ số mới (m³)
      unitPrice: { type: Number, required: true, min: 0 }, // VNĐ/m³
      amount: { type: Number, required: true, min: 0 },
    },

    // ---- Các phí cố định (snapshot tại thời điểm lập) ----
    garbageFee: { type: Number, default: 0, min: 0 },
    internetFee: { type: Number, default: 0, min: 0 },
    parkingFee: { type: Number, default: 0, min: 0 },
    otherFixedFees: [feeLineSchema],

    // ---- Phí phát sinh (không liên quan công thức điện nước) ----
    surcharges: [surchargeSchema],

    // ---- Tổng tiền ----
    subtotal: { type: Number, required: true, min: 0 }, // trước khi tính surcharges
    totalAmount: { type: Number, required: true }, // có thể âm nếu giảm trừ lớn

    // ---- Trạng thái & thanh toán ----
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },
    paidAt: { type: Date, default: null },

    note: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
