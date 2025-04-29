const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const PROTO_PATH = path.join(__dirname, "proto", "calculator.proto");
const packageDef = protoLoader.loadSync(PROTO_PATH);
const calcProto = grpc.loadPackageDefinition(packageDef).calculator;

function calculate(call, callback) {
  const { num1, num2, operation } = call.request;

  let result;

  switch (operation) {
    case "add":
      result = num1 + num2;
      break;

    case "subtract":
      result = num1 - num2;
      break;

    case "multiply":
      result = num1 * num2;
      break;

    case "divide":
      result = num2 !== 0 ? num1 / num2 : "Error (Divide by Zero)";

      break;

    default:
      result = "Invalid Operation";
  }

  callback(null, { result: result.toString() });
}

const server = new grpc.Server();

server.addService(calcProto.CalculatorService.service, {
  Calculate: calculate,
});

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("✅ gRPC Server running on port 50051");

    server.start();
  }
);
