const express = require("express");
const app = express();
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const cookieParser = require("cookie-parser");

// Proto setup
const PROTO_PATH_WEATHER = path.join(__dirname, "proto", "weather.proto");
const packageDefWeather = protoLoader.loadSync(PROTO_PATH_WEATHER);
const weatherProto = grpc.loadPackageDefinition(packageDefWeather).weather;
const clientWeather = new weatherProto.WeatherService(
  "127.0.0.1:50052",
  grpc.credentials.createInsecure()
);

// Import routes and middleware
const { authRoutes, authenticateToken } = require("./routes/auth_routes");

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Use the extracted auth routes
app.use(authRoutes);

// Homepage route
app.get("/", authenticateToken, (req, res) => {
  res.render("index", { temperature: null });
});

// Weather fetch route
app.post("/fetch-weather", authenticateToken, (req, res) => {
  const { area } = req.body;

  console.log("[WeatherService] Incoming Request: FetchWeather");
  console.log("Request Data:", { area });

  clientWeather.FetchWeather({ area }, (err, response) => {
    if (err) return res.send("gRPC Error: " + err.message);

    console.log("[WeatherService] Outgoing Response: FetchWeather");
    console.log("Response Data:", response);

    res.render("index", { temperature: response.temperature });
  });
});

app.listen(3000, () => {
  console.log("🌐 GUI running at http://localhost:3000");
});
