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
	const metadata=new grpc.Metadata();//new metadata object
	metadata.add('api-key', 'my-key');//adding api key to metadata
	return metadata;//return metadata
}

//Update Signal Function
function updateSignal(signalId, currentSignal){
	const metadata=getMetadata();//API request
	client.UpdateSignal({ signalId, currentSignal }, metadata, (err, response)=>{
		if(err){
			console.error('Signal Update Error:', err.message);//log error
		}else{
			console.log('Update:', response);//log reponse
			setTimeout(()=>{
				getSignal(signalId);//update signal after 1s
			}, 1000);
			setTimeout(()=>{
				streamSignal(signalId);//stream signal after 2s
			}, 2000);

		}
	});
}

//Get Signal Function
function getSignal(signalId){
	const metadata=getMetadata();//API request
	client.GetSignal({signalId}, metadata, (err,response)=>{
		if(err){
			console.error('Signal Error:', err.message);//log error
		}else{
			console.log('Signal Status:', response);//log response
		}
	});

}

//Stream Signal Function
function streamSignal(signalId){
	const metadata=getMetadata();//API request
	const call=client.StreamSignal({signalId}, metadata);//Streaming RPC call
	call.on('data', (signalStatus)=>{
		console.log('Streaming Update:', signalStatus);//log streaming status	
	});
	call.on('error', (err)=>{
		console.error('Stream error:', err.message);//log error
	});
	call.on('end', ()=>{
		console.log('Stream ended.');//log stream end
	});

}
updateSignal('Junction 5', 'Green');
//RG (x23233681) code end
