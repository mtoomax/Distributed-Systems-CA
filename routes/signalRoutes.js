//RG (x23233681) code start
const express = require("express");
const router = express.Router();
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the .proto file
const path = require("path");
const PROTO_PATH = path.join(__dirname, "../Ross/signal.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const signalProto = grpc.loadPackageDefinition(packageDefinition).signal;

//Create gRPC client
const client= new signalProto.SignalService(
	'localhost:50053',
	grpc.credentials.createInsecure()
);
//API key
function getMetadata(){
	const metadata=new grpc.Metadata();
	metadata.add('api-key', 'my-key');
	return metadata;
}
router.get("/stream-signal-sse", (req, res)=>{
	const signalId=req.query.signalId;
	if(!signalId){
		return res.status(400).end("signalId missing");
	}
	res.set({
		"Content-Type": "text/event-stream",
		"Cache-control": "no-cache",
		Connection: "keep-alive"
	});
	res.flushHeaders();
	const call = client.StreamSignal({signalId}, getMetadata());

	call.on("data", (signalStatus)=>{
		res.write(`data: ${JSON.stringify(signalStatus)}\n\n`);
	});
	
	call.on("error", (err)=>{
		res.write(`event: error\ndata: ${JSON.stringify({error: err.message})}\n\n`);
		res.end();
	});
	call.on("end", ()=>{
		res.write(`event: end\ndata: {}\n\n`);
		res.end();
	});
	req.on("close", ()=>{
		call.cancel();
		res.end();
	});
});
router.post("/fetch-signal", (req, res)=>{
	const signalId = req.body.signalId;
	if(!signalId){
		return res.render("index",{error: "Signal ID required", signalStatus: null, success: null});
	}
	client.GetSignal({signalId}, getMetadata(), (err, signalStatus)=>{
		if(err){
			console.error("GetSignal Error:", err.message);
			return res.render("index", {error: err.message, signalStatus: null, success: null});
		}
	res.render("index", {signalStatus, error:null, success: null});	
	});	
});
router.post("/update-signal", (req, res)=>{
	const {signalId, currentSignal} = req.body;
	if(!signalId||!currentSignal){
		return res.render("index", {
			error: "Signal ID & Value required",
		});
	}
	client.UpdateSignal({ signalId, currentSignal}, getMetadata(), (err, response)=>{
		if (err){
			console.error("Signal Error", err.message);
			return res.render("index", {error: err.message, success: null});
		}
		client.GetSignal({ signalId}, getMetadata(), (err2, signalStatus)=>{
			if(err2){
				console.error("Signal Error:", err2.message);
				return res.render("index", {error: err2.message, success: null});
			}
			res.render("index", {
				signalStatus,
				error: null,
				success: "Signal update successful",
			});
		});	
	});
});
module.exports = router;
//RG (x23233681) code end