const mongoose = require("mongoose");
const { Schema } = mongoose;

// Phí cố định tùy chỉnh (internet, giữ xe, v.v.)
const fixedFeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const roomSchema = new Schema(
  {
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    floor: {
      type: Number,
    },
    area: {
      type: Number, // m²
    },

    // ---- Giá phòng ----
    rentPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ---- Điện ----
    electricityRate: {
      type: Number, // VNĐ / kWh
      required: true,
      min: 0,
    },

    // ---- Nước ----
    waterRate: {
      type: Number, // VNĐ / m³
      required: true,
      min: 0,
    },

    // ---- Phí cố định hàng tháng ----
    garbageFee: { type: Number, default: 0, min: 0 },
    internetFee: { type: Number, default: 0, min: 0 },
    parkingFee: { type: Number, default: 0, min: 0 },

    // Các phí cố định khác do chủ nhà tùy chỉnh
    otherFixedFees: [fixedFeeSchema],

    // ---- Chu kỳ lập hóa đơn (ngày), mặc định 30 ngày ----
    billingCycleDays: {
      type: Number,
      default: 30,
      min: 1,
    },

    // ---- Trạng thái phòng ----
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Room", roomSchema);
