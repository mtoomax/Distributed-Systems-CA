// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { login, authenticateToken } = require("../auth");

// GET route for login page
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// POST route for login logic
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  try {
    const { token } = login(email, password);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/");
  } catch (err) {
    res.render("login", { error: "Invalid email or password" });
  }
});

// GET route for logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Export router and auth middleware
module.exports = {
  authRoutes: router,
  authenticateToken,
};
