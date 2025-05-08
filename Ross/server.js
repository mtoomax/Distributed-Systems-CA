//RG (x23233681) code start
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const logger = require('./logger');//Winston based logger

//Adding API key
const VALID_API_KEY = "my-key";

// Load the .proto file
const path = require("path");
const PROTO_PATH = path.join(__dirname, "signal.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const signalProto = grpc.loadPackageDefinition(packageDefinition).signal;

//Mock Data
const signals = {
	"Junction 1":{
		signalId: "Junction 1",
		currentSignal: "Red",
		timestamp: new Date().toISOString()
	},
	"Junction 2":{
		signalId: "Junction 2",
		currentSignal: "Red",
		timestamp: new Date().toISOString()
	},
	"Junction 3":{
		signalId: "Junction 3",
		currentSignal: "Red",
		timestamp: new Date().toISOString()
	},
	"Junction 4":{
		signalId: "Junction 4",
		currentSignal: "Green",
		timestamp: new Date().toISOString()
	},
	"Junction 5":{
		signalId: "Junction 5",
		currentSignal: "Green",
		timestamp: new Date().toISOString()
	}
};
//Validate API key
function isAuthorized(call){
	const key=call.metadata.get('api-key');
	return key.length>0&&key[0]===VALID_API_KEY;
}

//Implement Signal Service
const signalService = {
	UpdateSignal:(call, callback)=>{
		if(!isAuthorized(call)){//Handle updates
			return callback({code:grpc.status.UNAUTHENTICATED, message:"invalid API key"});//Reject unauthorised access
		}
		const { signalId, currentSignal }=call.request;
		const timestamp=new Date().toISOString();

		signals[signalId]={
			signalId: signalId,
			currentSignal: currentSignal,
			timestamp: timestamp,
		};
		//log update
		logger.info(`Signal updated: ${signalId}->${currentSignal}`);
		callback(null, {success:true, message:"Signal updated successfully"});//return response
	},

	GetSignal:(call, callback)=>{//return current junction signal
		if(!isAuthorized(call)){
			return callback({code:grpc.status.UNAUTHENTICATED, message:"invalid API key"});
		}
		const{ signalId }= call.request;

		if(signals[signalId]){
			callback(null, {
				signalId: signals[signalId].signalId,
				currentSignal: signals[signalId].currentSignal,
				timestamp: signals[signalId].timestamp,
			});
		}else{
			callback({
				code:grpc.status.NOT_FOUND,
				details: "Signal not found",
			});
		}

	},

	StreamSignal: (call)=>{//Stream junction signal status eevry 5s
		if (!isAuthorized(call)){
			call.destroy(new Error("Invalid API key"));
			return;
		}
		const{ signalId }=call.request;

		if(!signals[signalId]){
			call.destroy(new Error("Signal not found"));
			return;
		}

	//Status updated every 5s
	const intervalId=setInterval(()=>{
		call.write({
			signalId: signals[signalId].signalId,
			currentSignal: signals[signalId].currentSignal,
			timestamp: new Date().toISOString(),
		});
	}, 5000);
	//If client disconnects
	call.on('cancelled', ()=>{
		clearInterval(intervalId);
	});
	},
};
//start gRPC server and bind port 50053
const server = new grpc.Server();
server.addService(signalProto.SignalService.service, signalService);
server.bindAsync("0.0.0.0:50053", grpc.ServerCredentials.createInsecure(), () => {
    logger.info("Signal Service is running on port 50053...");
});
//RG (x23233681) code end
