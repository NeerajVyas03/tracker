require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Sessions
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Set View Engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () => console.log("MongoDB Connected"));

// Routes
const authRoutes = require("./routes/authRoutes");
const prayerRoutes = require("./routes/prayerRoutes");
app.use("/auth", authRoutes);
app.use("/prayers", prayerRoutes);

app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
