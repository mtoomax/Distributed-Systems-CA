//RG (x23233681) code start
//Import modules
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
	const metadata=new grpc.Metadata();//New metadata object
	metadata.add('api-key', 'my-key');//API key population
	return metadata;//return metadata
}
//Route definition for using server-sent events
router.get("/stream-signal-sse", (req, res)=>{
	const signalId=req.query.signalId; //extract signalId
	if(!signalId){
		return res.status(400).end("signalId missing");//error message
	}
	//SSE headers
	res.set({
		"Content-Type": "text/event-stream",//response definition as SSE stream
		"Cache-control": "no-cache",//disable caching
		Connection: "keep-alive" //keep connection open
	});
	res.flushHeaders(); //flush headers to start stream
	const call = client.StreamSignal({signalId}, getMetadata());
	//Listen for incoming data
	call.on("data", (signalStatus)=>{
		res.write(`data: ${JSON.stringify(signalStatus)}\n\n`);//send each status update to client in SSE
	});
	
	call.on("error", (err)=>{ //error handling
		res.write(`event: error\ndata: ${JSON.stringify({error: err.message})}\n\n`);
		res.end();
	});
	call.on("end", ()=>{ //stream end handling
		res.write(`event: end\ndata: {}\n\n`);
		res.end();
	});
	req.on("close", ()=>{ //stream cancelled if client connection closed
		call.cancel();
		res.end();
	});
});
//POST request to fetch current signal
router.post("/fetch-signal", (req, res)=>{
	const signalId = req.body.signalId;
	if(!signalId){
		return res.render("index",{error: "Signal ID required", signalStatus: null, success: null});// error handling
	}
	client.GetSignal({signalId}, getMetadata(), (err, signalStatus)=>{ //call RPC method
		if(err){
			console.error("GetSignal Error:", err.message);
			return res.render("index", {error: err.message, signalStatus: null, success: null}); //error handling
		}
	res.render("index", {signalStatus, error:null, success: null});	//render status if successful
	});	
});
//POST request to update signal
router.post("/update-signal", (req, res)=>{
	const {signalId, currentSignal} = req.body;
	if(!signalId||!currentSignal){
		return res.render("index", {
			error: "Signal ID & Value required",
		}); //error handling
	}
	client.UpdateSignal({ signalId, currentSignal}, getMetadata(), (err, response)=>{ //Call RPC method
		if (err){
			console.error("Signal Error", err.message);
			return res.render("index", {error: err.message, success: null}); //error handling
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
			}); //render status if successful
		});	
	});
});
module.exports = router; //export for main app use
//RG (x23233681) code end
