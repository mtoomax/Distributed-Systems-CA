const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");


// Import authentication routes and middleware
const { authRoutes, authenticateToken } = require("./routes/auth_routes");
const signalRoutes = require("./routes/signalRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Use the extracted routes
app.use(authRoutes);
app.use(signalRoutes);
app.use(weatherRoutes);

// Homepage route
app.get("/", authenticateToken, (req, res) => {
  res.render("index", { 
	temperature: null, 
	signalStatus: null,
	success: null,
	error: null 
	});
});


app.listen(3000, () => {
  console.log("🌐 GUI running at http://localhost:3000");
});
