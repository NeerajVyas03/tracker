const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Render Signup Page
router.get("/signup", (req, res) => {
  res.render("signup");
});

// Handle Signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.render("signup", { error: "Email already exists!" });
    }
    const user = new User({ email, password });
    await user.save();
    req.session.userId = user._id;
    res.redirect("/prayers/setup"); // Redirect to first-time setup
  } catch (err) {
    res.render("signup", { error: "Something went wrong!" });
  }
});

// Render Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

// Handle Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.render("login", { error: "Invalid credentials!" });
    }
    req.session.userId = user._id;
    res.redirect("/prayers/dashboard");
  } catch (err) {
    res.render("login", { error: "Something went wrong!" });
  }
});

// Handle Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});

module.exports = router;
