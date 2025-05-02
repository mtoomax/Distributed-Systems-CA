//RG (x23233681) code start
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the .proto file
const PROTO_PATH = 'signal.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const signalProto = grpc.loadPackageDefinition(packageDefinition).signal;

//Create gRPC client
const client= new signalProto.SignalService(
	'localhost:50051',
	grpc.credentials.createInsecure()
);

//Update Signal Function
function updateSignal(signalId, currentSignal){
	client.UpdateSignal({ signalId, currentSignal }, (err, response)=>{
		if(err){
			console.error('Signal Update Error:', err.message);
		}else{
			console.log('Update:', response);
			setTimeout(()=>{
				getSignal(signalId);
			}, 1000);
			setTimeout(()=>{
				streamSignal(signalId);
			}, 2000);

		}
	});
}

//Get Signal Function
function getSignal(signalId){
	client.GetSignal({signalId}, (err,response)=>{
		if(err){
			console.error('Signal Error:', err.message);
		}else{
			console.log('Signal Status:', response);
		}
	});

}

//Stream Signal Function
function streamSignal(signalId){
	const call=client.StreamSignal({signalId});
	call.on('data', (signalStatus)=>{
		console.log('Streaming Update:', signalStatus);		
	});
	call.on('error', (err)=>{
		console.error('Stream error:', err.message);
	});
	call.on('end', ()=>{
		console.log('Stream ended.');
	});

}
updateSignal('Junction 5', 'Green');
//RG (x23233681) code end