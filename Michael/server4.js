const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = "./watermeter4.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const waterMeterProto = grpc.loadPackageDefinition(packageDefinition).watermeter;

function getWaterMeterLevel(level){
	
	if(level<100){
		
		return "Low Flow Warning";
		
	}
	else if(level<500){
				
		return "Normal Flow";
		
	}
	else{
		
		return "High Flow Warning";
	}
	
}

function readingNow(call,callback){
	
	const level = call.request.requestWaterMeter;
	const checkLevel = getWaterMeterLevel(level);
	callback(null, {responseWaterMeter:checkLevel});	
	
}

function infoReading(call, callback){
		
	let i = 0;
	let j = 0;
	call.on('data',(WaterMeterRequest) => {
		console.log("Recieving");
		i += WaterMeterRequest.requestWaterMeter;
		j++;
		console.log(i);
		
	});	

	call.on("end", () =>
	{
	let average=0;		
	if(j!==0){ 
	
	 average=i/j;
	 
	}
	let readingAverage = getWaterMeterLevel(average);
	callback(null,{responseWaterMeter:readingAverage });
	});
}

function waterMeterChat(call){
	
	call.on("data",(WaterMeterRequest) => {
		
	let reading=getWaterMeterLevel(WaterMeterRequest.requestWaterMeter);
	call.write({responseWaterMeter:reading});
	
	});
	
	call.on("end", () => {
		
		console.log("End");
		call.end();
		
	});

}

const waterMeterService = {WaterMeterNow : readingNow, WaterMeterClient :infoReading,WaterMeterBidirectional : waterMeterChat};

const server = new grpc.Server();
server.addService(waterMeterProto.WaterMeter.service, waterMeterService);

server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
    console.log("gRPC watermeter Server is running on port 50051...");
});
