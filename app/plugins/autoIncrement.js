const Counter = require("../models/Counter.model");

function autoIncrementPlugin(schema, options) {
  const field = options.field || "index";
  const counterName = options.counterName;

  if (!counterName) {
    throw new Error("autoIncrementPlugin requires counterName");
  }

  schema.add({
    [field]: {
      type: Number,
      unique: true,
      index: true,
    },
  });

  schema.pre("save", async function () {
    if (!this.isNew) return;
    if (this[field] != null) return;

    const counter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
      },
    );

    this[field] = counter.seq;
  });
}

module.exports = autoIncrementPlugin;
