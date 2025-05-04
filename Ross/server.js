//RG (x23233681) code start
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

//Adding API key
const VALID_API_KEY = "my-key";

// Load the .proto file
const PROTO_PATH = 'signal.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const signalProto = grpc.loadPackageDefinition(packageDefinition).signal;

//Signal Store in memory
const signals = {};

function isAuthorized(call){
	const key=call.metadata.get('api-key');
	return key.length>0&&key[0]===VALID_API_KEY;
}

//Implement Signal Service
const signalService = {
	UpdateSignal:(call, callback)=>{
		if(!isAuthorized(call)){
			return callback({code:grpc.status.UNAUTHENTICATED, message:"invalid API key"});
		}
		const { signalId, currentSignal }=call.request;
		const timestamp=new Date().toISOString();

		signals[signalId]={
			signalId: signalId,
			currentSignal: currentSignal,
			timestamp: timestamp,
		};

		console.log(`Signal updated: ${signalId}->${currentSignal}`);
		callback(null, {success:true, message:"Signal updated successfully"});
	},

	GetSignal:(call, callback)=>{
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

	StreamSignal: (call)=>{
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

	call.on('cancelled', ()=>{
		clearInterval(intervalId);
	});
	},
};

const server = new grpc.Server();
server.addService(signalProto.SignalService.service, signalService);
server.bindAsync("0.0.0.0:50053", grpc.ServerCredentials.createInsecure(), () => {
    console.log("Signal Service is running on port 50053...");
});


//RG (x23233681) code end
