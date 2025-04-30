const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = "./watermeter4.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const waterMeterProto = grpc.loadPackageDefinition(packageDefinition).watermeter;
const client = new waterMeterProto.WaterMeter("localhost:50051", grpc.credentials.createInsecure());

const readline = require("readline").createInterface({
	
	input: process.stdin,
	output: process.stdout
	
});

function readingNow(){
	
	let num = Math.random()*1000;
	client.WaterMeterNow({requestWaterMeter : num}, (error, response) => {
	if(error){
		console.error(error);
	}
	else {
		console.log("The current : ", response.responseWaterMeter);
	}
	}
	);
}
function infoReading(){ 

	const call = client.WaterMeterClient((error, response) => {
	if(error){
		console.error("Error: ", error);
	}
	else{
	console.log("The current water level is: ", response.responseWaterMeter);
	}
	});
	
	for(let i=0;i<5;i++){ 
		
		let num = Math.random()*1000;
		console.log("nums ", num);
		call.write({requestWaterMeter: num});
		
	}
	
	call.end();

}
function waterMeterChat(){
	
	const call = client.WaterMeterBidirectional();	
	call.on("data", (response)=>{
	
		console.log("The latest update: ", response.responseWaterMeter);
		
	});	
	
	for(let i=0;i<5;i++){
		
		let num = Math.random()*1000;
		call.write({requestWaterMeter : num});
	
	}	
		
	call.on("end", ()=>
	{	
		console.log("Call end");
	
	});	
	
	call.on("error", (error) => 
	{
		console.error(error);
		

	});	
	
}

console.log("Watermeter\n1.Simple\n2.ClientSide\n3.Bi-directional ");
readline.question("Select choice, between 1,2 or 3", (choice) => {
	
	if(!isNaN(choice)){
	
		const num = parseInt(choice);
		
		
			if(num===1){
				
				readingNow();
				readline.close();
				
			}
			else if(num===2){
				
				infoReading();
				readline.close();
				
			}
			else if(num===3){
				
				waterMeterChat();
				readline.close();
				
			}
			else{
		
				console.log("Not valid input");
				readline.close();
			}
			}
	
	});
