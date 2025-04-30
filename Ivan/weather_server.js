const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../proto", "weather.proto");
const packageDef = protoLoader.loadSync(PROTO_PATH);
const weatherProto = grpc.loadPackageDefinition(packageDef).weather;

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

  const weatherData = {
    "Dublin City Centre": 14.5,
    "Temple Bar": 14.8,
    "Rathmines": 15.2,
    "Dundrum": 16.1,
    "Ballsbridge": 15.6,
    "Donnybrook": 15.0,
    "Clontarf": 14.9,
    "Drumcondra": 15.3,
    "Phibsborough": 15.1,
    "Howth": 13.8,
    "Sandymount": 15.4,
    "Malahide": 14.2,
    "Blanchardstown": 16.0,
    "Tallaght": 16.3,
    "Lucan": 15.7,
    "Swords": 14.7,
    "Ballyfermot": 15.0,
    "Cabra": 15.1,
    "Coolock": 14.6,
    "Artane": 14.5
  };

  // Get the temperature based on the area
  const temperature = weatherData[area];

  let response;
  if (temperature) {
    response = { temperature: temperature };
  } else {
    response = {
      code: grpc.status.NOT_FOUND,
      details: "Area not found"
    };
  }

  logResponse("FetchWeather", response);  // Log the outgoing response

  callback(null, response);  // Send the response back to the client
}

const server = new grpc.Server();

// Add the FetchWeather RPC to the server
server.addService(weatherProto.WeatherService.service, {
  FetchWeather: fetchWeather,
});

server.bindAsync(
  "0.0.0.0:50052",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("✅ gRPC Weather Server running on port 50052");
  }
);
