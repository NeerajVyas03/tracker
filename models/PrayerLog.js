const mongoose = require("mongoose");

const prayerLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  wakeUpTime: { type: String, required: true },
  prayers: { type: [Boolean], default: [false, false, false] }, // 3 prayers per day
});

module.exports = mongoose.model("PrayerLog", prayerLogSchema);
