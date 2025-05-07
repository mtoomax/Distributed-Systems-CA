const express = require("express");
const app = express();

// Required libraries/Modules
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const cookieParser = require("cookie-parser");

// Proto setup
const PROTO_PATH_WEATHER = path.join(__dirname, "weather.proto");
const packageDefWeather = protoLoader.loadSync(PROTO_PATH_WEATHER);
const weatherProto = grpc.loadPackageDefinition(packageDefWeather).weather;
const clientWeather = new weatherProto.WeatherService(
  "127.0.0.1:50052",
  grpc.credentials.createInsecure()
);

// Import authentication routes and middleware
const { authRoutes, authenticateToken } = require("../routes/auth_routes");
const signalRoutes = require("../routes/signalRoutes");

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(signalRoutes);

// Use the extracted auth routes
app.use(authRoutes);

// Homepage route
// Homepage route
app.get("/", authenticateToken, (req, res) => {
  res.render("index", { 
	temperature: null, 
	signalStatus: null,
	success: null,
	error: null 
	});
});

// Weather fetch route
app.post("/fetch-temperature", authenticateToken, (req, res) => {
  const { area } = req.body;

  console.log("[WeatherService] Outgoing Request: FetchTemperature");
  console.log("Request Data:", { area });

  clientWeather.FetchTemperature({ area }, (err, response) => {
    if (err) {
      console.error("[WeatherService] gRPC Error:", err);
      return res.render("index", {
        temperature: null,
        error: err.details || "An unexpected error occurred",
      });
    }

    console.log("[WeatherService] Incoming Response: FetchTemperature");
    console.log("Response Data:", response);

    res.render("index", {
      temperature: response.temperature,
      error: null,
    });
  });
});

// Stream temperature route
app.get("/stream-temperature-sse", authenticateToken, (req, res) => {
  const { area } = req.query;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const call = clientWeather.StreamTemperature({ area });

  call.on("data", (response) => {
    res.write(`data: ${JSON.stringify(response)}\n\n`);
    console.log("[WeatherService] Incoming Response: StreamTemperature");
    console.log("Response Data:", response);
  });

  call.on("error", (err) => {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.details })}\n\n`);
    console.error("[WeatherService] gRPC Error:", err);
    res.end();
  });

  call.on("end", () => {
    res.write("event: end\ndata: Stream ended\n\n");
    console.log("[WeatherService] Stream ended");
    res.end();
  });
});




app.listen(3000, () => {
  console.log("🌐 GUI running at http://localhost:3000");
});
