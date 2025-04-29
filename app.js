const express = require("express");
const app = express();
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Path for the calculator.proto
const PROTO_PATH_CALC = path.join(__dirname, "proto", "calculator.proto");
const packageDefCalc = protoLoader.loadSync(PROTO_PATH_CALC);
const calcProto = grpc.loadPackageDefinition(packageDefCalc).calculator;

// Path for the weather.proto
const PROTO_PATH_WEATHER = path.join(__dirname, "proto", "weather.proto");
const packageDefWeather = protoLoader.loadSync(PROTO_PATH_WEATHER);
const weatherProto = grpc.loadPackageDefinition(packageDefWeather).weather;

// gRPC client for the Calculator service
const clientCalc = new calcProto.CalculatorService(
  "127.0.0.1:50051",
  grpc.credentials.createInsecure()
);

// gRPC client for the Weather service
const clientWeather = new weatherProto.WeatherService(
  "127.0.0.1:50052",
  grpc.credentials.createInsecure()
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Function to log incoming requests
function logRequest(serviceName, method, request) {
  console.log(`[${serviceName}] Incoming Request: ${method}`);
  console.log("Request Data:", request);
}

// Function to log outgoing responses
function logResponse(serviceName, method, response) {
  console.log(`[${serviceName}] Outgoing Response: ${method}`);
  console.log("Response Data:", response);
}

// Render the homepage with default null values
app.get("/", (req, res) => {
  res.render("index", { result: null, temperature: null });
});

// POST route for calculator functionality
app.post("/calculate", (req, res) => {
  const { num1, num2, operation } = req.body;

  // Log the request
  logRequest("CalculatorService", "Calculate", { num1, num2, operation });

  clientCalc.Calculate(
    { num1: parseFloat(num1), num2: parseFloat(num2), operation },

    (err, response) => {
      if (err) {
        return res.send("gRPC Error: " + err.message);
      }

      // Log the response
      logResponse("CalculatorService", "Calculate", response);

      res.render("index", { result: response.result, temperature: null });
    }
  );
});

// POST route for fetching weather based on area
app.post("/fetch-weather", (req, res) => {
  const { area } = req.body;

  // Log the request
  logRequest("WeatherService", "FetchWeather", { area });

  clientWeather.FetchWeather(
    { area: area },

    (err, response) => {
      if (err) {
        return res.send("gRPC Error: " + err.message);
      }

      // Log the response
      logResponse("WeatherService", "FetchWeather", response);

      res.render("index", { result: null, temperature: response.temperature });
    }
  );
});

app.listen(3000, () => {
  console.log("🌐 GUI running at http://localhost:3000");
});
