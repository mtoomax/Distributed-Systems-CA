const express = require("express");

const app = express();

const grpc = require("@grpc/grpc-js");

const protoLoader = require("@grpc/proto-loader");

const path = require("path");

const PROTO_PATH = path.join(__dirname, "proto", "calculator.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH);

// const calcProto = grpc.loadPackageDefinition(packageDef).calculator;
