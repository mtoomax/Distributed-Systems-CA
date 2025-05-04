// Require Libraries
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Initialize proto file path and load modules
const PROTO_PATH = path.join(__dirname, "weather.proto");
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
function FetchTemperature(call, callback) {
  const { area } = call.request;

  logRequest("FetchTemperature", call.request);  // Log the incoming request

  // Get the temperature based on the area
  const temperature = weatherData[area];

  if (temperature !== undefined) {
    const response = { temperature };
    logResponse("FetchTemperature", response);  // Log the outgoing response
    return callback(null, response);
  } else {
    const error = {
      code: grpc.status.NOT_FOUND,
      message: "Area not found",
    };
    logResponse("FetchTemperature", error);  // Log the outgoing response
    return callback(error, null);
  }
}

// StreamTemperature Functuin
function StreamTemperature(call) {
  const { area } = call.request;
  console.log("Incoming Request: StreamTemperature", call.request);

  let count = 0;

  // Simulate a stream of temperatures every second
  const intervalId = setInterval(() => {
    if (count >= 5) {
      clearInterval(intervalId);
      return call.end();
    }

    const temperature = weatherData[area];

    if (temperature !== undefined) {
      const fluctuatedTemp = temperature + (Math.random() * 2 - 1); // simulate fluctuation
      call.write({ temperature: fluctuatedTemp });
    } else {
      call.destroy({
        code: grpc.status.NOT_FOUND,
        message: "Area not found",
      });
      clearInterval(intervalId);
    }

    count++;
  }, 1000);
}


const server = new grpc.Server();

// Add the FetchWeather RPC to the server
server.addService(weatherProto.WeatherService.service, { FetchTemperature: FetchTemperature, StreamTemperature: StreamTemperature,});

server.bindAsync( "0.0.0.0:50052", grpc.ServerCredentials.createInsecure(),
  () => { console.log("✅ gRPC Weather Server running on port 50052"); }
);
