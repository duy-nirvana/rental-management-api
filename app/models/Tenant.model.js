const mongoose = require("mongoose");
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    idCard: {
      type: String, // CMND / CCCD
      trim: true,
      unique: true,
      sparse: true, // cho phép null/undefined không bị trùng
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    permanentAddress: {
      type: String,
      trim: true,
    },

    // ---- Phòng hiện tại ----
    // null = chưa ở phòng nào / đã trả phòng
    currentRoom: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    moveInDate: {
      type: Date,
    },
    moveOutDate: {
      type: Date,
      default: null,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Mỗi người chỉ có đúng 1 trường currentRoom → tự nhiên không thể ở 2 phòng cùng lúc.
// Index thường để tăng tốc query theo phòng (lấy danh sách người trong phòng).
tenantSchema.index({ currentRoom: 1 });

module.exports = mongoose.model("Tenant", tenantSchema);
