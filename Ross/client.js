//RG (x23233681) code start
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the .proto file
const PROTO_PATH = 'signal.proto';
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

//Update Signal Function
function updateSignal(signalId, currentSignal){
	const metadata=getMetadata();
	client.UpdateSignal({ signalId, currentSignal }, metadata, (err, response)=>{
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
	const metadata=getMetadata();
	client.GetSignal({signalId}, metadata, (err,response)=>{
		if(err){
			console.error('Signal Error:', err.message);
		}else{
			console.log('Signal Status:', response);
		}
	});

}

//Stream Signal Function
function streamSignal(signalId){
	const metadata=getMetadata();
	const call=client.StreamSignal({signalId}, metadata);
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
