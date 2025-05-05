const grpc = require("@grpc/grpc-js"); //imports grpc library
const protoLoader = require("@grpc/proto-loader"); //imports the proto loader
const PROTO_PATH = "./watermeter.proto"; // path to the file
const packageDefinition = protoLoader.loadSync(PROTO_PATH); //loads the proto files
const waterMeterProto=grpc.loadPackageDefinition(packageDefinition).watermeter;
//creates a grpc ready package 
let deviceDetails = [
	{name : "A1", connected : "No"},
	{name : "B2", connected : "Yes"},
	{name : "C3", connected : "No"},
	{name : "D4", connected : "Yes"}

];


function softwareUpdates(call){
	
let upDates = [
"Update 1","Update 2","Update 3" 
];
	for(let i=0; i<upDates.length ; i++){
		
		call.write({packets : upDates[i]});
		
	}
	call.end();
	
}
function getWaterMeterLevel(level){ // checks water level and sends text back 
	
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

function connect(input){

	for(let i=0;i<deviceDetails.length;i++){
	
		if(deviceDetails[i].name===input){
						
			if(deviceDetails[i].connected==="No"){
			
				deviceDetails[i].connected="Yes";
						
			}
			return "Device found and connected";
		}
	}			
	return ("Device not found");
		
}

function discoverDevice(call,callback){ //unary reading watermeter
	
	const device = call.request.requestDevice; //gets randon number from client
	const checkDevice = connect(device); //gets flow message
	callback(null, {responseFromDevice:checkDevice}); //sends back reading
	
}
function readingNow(call, callback){ //unary reading watermeter
	
	const level = call.request.requestWaterMeter; //gets randon number from client
	const checkLevel = getWaterMeterLevel(level); //gets flow message
	callback(null, {responseWaterMeter:checkLevel}); //sends back reading
	
}
function averageReading(call, callback){ //method adds up total flow, then calculate average num
		
	let totalFlow = 0; // start total flow at zero
	let numberOfInputs = 0; //number of numbers sent
	call.on('data',(WaterMeterRequest) => { //listens for client data
		
		totalFlow += WaterMeterRequest.requestWaterMeter;
		numberOfInputs++;	
	
	});	

	call.on("end", () => //calculates average on end
	{
		let average=0;		
		if(numberOfInputs!==0){  //only divide if numberOfInputs is not zero
	
			average = totalFlow/numberOfInputs;
	
		}
		const readingAverage = getWaterMeterLevel(average); //get level text
		callback(null,{responseWaterMeter:readingAverage });
	});
}
function waterMeterLive(call){ //sends client level reading text every second
	
	call.on("data",(WaterMeterRequest) => {	//recieve number from client
	
		let reading=getWaterMeterLevel(WaterMeterRequest.requestWaterMeter);
		call.write({responseWaterMeter:reading}); //send back response
	
	});
	
	call.on("end", () => { //call listens for end
		
		console.log("End");
		call.end();
		
	});

}

const waterMeterService = 
{WaterMeterNow : readingNow, AverageWaterMeterFlow :averageReading, LiveWaterMeterFlow : waterMeterLive, DiscoverWaterMeter : discoverDevice,SoftwareUpdates : softwareUpdates }; //connects proto methods to functions 
const server = new grpc.Server(); // a grpc server
server.addService(waterMeterProto.WaterMeter.service, waterMeterService); //registers WaterMeter service
server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
    console.log("gRPC watermeter Server is running on port 50051...");
}); //binds port and server 
