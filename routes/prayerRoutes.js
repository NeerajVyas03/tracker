const express = require("express");
const moment = require("moment");
const User = require("../models/User");
const PrayerLog = require("../models/PrayerLog");

const router = express.Router();

// 📌 Middleware: Check Authentication
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/auth/login");
  }
  next();
};

// 📌 First-time Setup Page (Start Date selection)
router.get("/setup", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (user.startDate) return res.redirect("/prayers/dashboard"); // Skip setup if already done
  res.render("setup");
});

// 📌 Handle Start Date Submission
router.post("/setup", isAuthenticated, async (req, res) => {
  const { startDate } = req.body;
  if (!startDate) {
    return res.render("setup", { error: "Please select a start date" });
  }

  const user = await User.findById(req.session.userId);
  user.startDate = new Date(startDate);
  await user.save();

  res.redirect("/prayers/dashboard"); // Redirect to dashboard
});

// 📌 Dashboard Page - Show progress & prayer logs
router.get("/dashboard", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user.startDate) return res.redirect("/prayers/setup");

  const today = moment().startOf("day");
  const startDate = moment(user.startDate).startOf("day");
  const endDate = startDate.clone().add(89, "days").startOf("day");
  const dayNumber = today.diff(startDate, "days") + 1;

  if (dayNumber > 89) {
    return res.render("dashboard", {
      user,
      dayNumber,
      prayerLogs: [],
      progressPercentage: 100,
      moment, // Pass moment.js to Pug
    });
  }

  // Fetch all prayer logs for 90 days
  const prayerLogs = await PrayerLog.find({ userId: user._id }).sort({
    date: 1,
  });

  // Calculate progress
  const completedDays = prayerLogs.filter((log) =>
    log.prayers.every((p) => p)
  ).length;
  const progressPercentage = (completedDays / 90) * 100;

  // Get today's prayer log
  const todayLog = await PrayerLog.findOne({
    userId: user._id,
    date: today.toDate(),
  });

  // 📌 Generate prayer intervals (if wake-up time exists)
  let prayerIntervals = [];
  if (todayLog && todayLog.wakeUpTime) {
    const wakeUpTime = moment(todayLog.wakeUpTime, "HH:mm");
    prayerIntervals = [
      wakeUpTime.clone().add(4, "hours").format("hh:mm A"),
      wakeUpTime.clone().add(8, "hours").format("hh:mm A"),
      wakeUpTime.clone().add(12, "hours").format("hh:mm A"),
    ];
  }

  res.render("dashboard", {
    user,
    startDate,
    endDate,
    dayNumber,
    prayerLogs,
    progressPercentage,
    todayLog,
    prayerIntervals, // ✅ Pass prayer intervals to Pug
    moment,
    user,
  });
});

// 📌 Handle Wake-Up Time Logging
router.post("/log-wakeup", isAuthenticated, async (req, res) => {
  const { wakeUpTime } = req.body;
  if (!wakeUpTime) {
    return res.render("dashboard", { error: "Please enter wake-up time" });
  }

  const user = await User.findById(req.session.userId);
  const today = moment().startOf("day");

  let prayerLog = await PrayerLog.findOne({
    userId: user._id,
    date: today.toDate(),
  });

  if (!prayerLog) {
    prayerLog = new PrayerLog({
      userId: user._id,
      date: today.toDate(),
      wakeUpTime,
      prayers: [false, false, false], // Default all to false
    });
  } else {
    prayerLog.wakeUpTime = wakeUpTime; // Update wake-up time if log exists
  }

  await prayerLog.save();
  res.redirect("/prayers/dashboard");
});

// 📌 Mark a Prayer as Done
router.post("/mark", isAuthenticated, async (req, res) => {
  try {
    const { date, prayerNumber } = req.body;
    if (!date || !prayerNumber) return res.redirect("/prayers/dashboard");

    const user = await User.findById(req.session.userId);
    const formattedDate = moment(date, "YYYY-MM-DD").startOf("day").toDate(); // Ensure proper date format

    let prayerLog = await PrayerLog.findOne({
      userId: user._id,
      date: formattedDate,
    });

    if (prayerLog) {
      prayerLog.prayers[prayerNumber - 1] = true; // Mark prayer as done
      await prayerLog.save();
    }

    res.redirect("/prayers/dashboard");
  } catch (error) {
    console.error("Error marking prayer:", error);
    res.redirect("/prayers/dashboard");
  }
});

// 📌 Fetch Prayer Data for the Dashboard (AJAX)
router.get("/fetch-prayers", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user.startDate)
      return res.status(400).json({ error: "Start date not set" });

    const prayerLogs = await PrayerLog.find({ userId: user._id }).sort({
      date: 1,
    });

    res.json({ prayerLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

module.exports = router;
