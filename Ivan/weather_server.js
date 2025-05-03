// Require Libraries
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Initialize proto file path and load modules
const PROTO_PATH = path.join(__dirname, "../proto", "weather.proto");
const packageDef = protoLoader.loadSync(PROTO_PATH);
const weatherProto = grpc.loadPackageDefinition(packageDef).weather;
const weatherData = require("./weather_data.js");

// Function to log requests
function logRequest(method, request) {
  console.log(`Incoming Request: ${method}`);
  console.log("Request Data:", request);
}

// Function to log responses
function logResponse(method, response) {
  console.log(`Outgoing Response: ${method}`);
  console.log("Response Data:", response);
}

// FetchWeather function
function fetchWeather(call, callback) {
  const { area } = call.request;

  logRequest("FetchWeather", call.request);  // Log the incoming request

  // Get the temperature based on the area
  const temperature = weatherData[area];

  if (temperature !== undefined) {
    const response = { temperature };
    logResponse("FetchWeather", response);  // Log the outgoing response
    return callback(null, response);
  } else {
    const error = {
      code: grpc.status.NOT_FOUND,
      message: "Area not found",
    };
    logResponse("FetchWeather", error);  // Log the outgoing response
    return callback(error, null);
  }
}

const server = new grpc.Server();

// Add the FetchWeather RPC to the server
server.addService(weatherProto.WeatherService.service, { FetchWeather: fetchWeather});

server.bindAsync( "0.0.0.0:50052", grpc.ServerCredentials.createInsecure(),
  () => { console.log("✅ gRPC Weather Server running on port 50052"); }
);
