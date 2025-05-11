/*
Name: Michael Toomey
ID: x24127639
Date: 11/05/2025
*/

const grpc = require("@grpc/grpc-js"); //imports grpc library 
const protoLoader = require("@grpc/proto-loader"); //imports the proto file loader
const PROTO_PATH = "./watermeter.proto"; //the file path
const packageDefinition = protoLoader.loadSync(PROTO_PATH); //parses .proto file
const waterMeterProto = grpc.loadPackageDefinition(packageDefinition).watermeter; //create grpc packageconst
const client = new waterMeterProto.WaterMeter("localhost:50051", grpc.credentials.createInsecure()); //create a client to the server
const readline = require("readline").createInterface({ //interface
	
	input: process.stdin,
	output: process.stdout
	
});

function connect(input){ //unary reading method
	
	client.DiscoverWaterMeter({requestDevice : input}, (error, response) => {
		if(error){ //establish a connection, with error handling
			console.error("Error in device discovery",error);
		}
		else {
			console.log("Device discovered: ", response.responseFromDevice); 
			//Informs user current level
			selectService(); //call selectService;
		}
	});
}

function checkInput(input){ //confirms input is a number
	
	return (!isNaN(input));
				
}
function readingNow(){ //unary reading method
	
	let num = Math.random()*1000; //generate a random number
	client.WaterMeterNow({requestWaterMeter : num}, (error, response) => {
		if(error){ //establish a connection, with error handling
			console.error(error);
		}
		else {
			console.log("The current : ", response.responseWaterMeter); //Informs user current level
		}
	});
	
}
function averageReading(input){ //function for the average flow over a number of seconds 

	let i = 0; //set interval counter to zero
	const call = client.AverageWaterMeterFlow((error, response) => {
		if(error){ //establish a connection, handle the error incase it does not succeed 
		
			console.error("Error: ", error);
		}
		else{ //Prrint the average level
	
			console.log("The average water level is: ", response.responseWaterMeter);
		
		}
		readline.close();
	});		
	const interval = setInterval(() => { //interval sends a random number to server every second
		
		i++;
		console.log("Number of seconds: ", i);	 //user inputs the seconds		
		let num = Math.random()*1000;
		call.write({requestWaterMeter : num});	
		if(i >= input){
					
			clearInterval(interval);			
			call.end();	
			console.log("end");
		}
	},	1000);
					
	call.on("end", ()=> //employed when the call ends 
	{	
	
		console.log("Call end");
			
	});	
	
	call.on("error", (error) => //employed if an error occurs
	{
		console.error(error);
		
	});	
	
}
function waterMeterLive(input ){ //the bidirectional function
	let checkLineClosed= false;
	let i=0; //start counter at zero
			
	const call = client.LiveWaterMeterFlow();	 
	call.on("data", (response) => { //receive data
	
		console.log("The latest update: ", response.responseWaterMeter);
		
	});				
	const interval = setInterval(() => { //send a random number to the server every second
		i++;	
		
		let num = Math.random()*1000; //random number
		
		call.write({requestWaterMeter : num});
		
		if(i >= input){ //clear interval when it reaches input
					
			clearInterval(interval);
			call.end();
					
		}
	},	1000);
	
	const liveReadline = () => {
		if(!checkLineClosed){
				
				readline.close();
				checkLineClosed = true;
		}
	};
			
				
	call.on("end", ()=> //close on end
	{	
		console.log("Call end");
		readline.close();
	
	});		
	call.on("error", (error) =>  //close if an error occurs
	{
		console.error(error);
		readline.close();

	});	
	
}
function getUpdates(){ //server streaming, updates sensoer client 
	
	const call =client.softwareUpdates(); //create call Object
	
	call.on("data", (data) => {
		
		console.log("Received ", data.packets);
		
	});
	call.on("end", () => {
		
		console.log("Updates complete");
		
	});
	
	
}
function selectDevice(){ //lets user select device 
readline.question("Select Device:\nEnter 1 for device A1\nEnter 2 for device B2\nEnter 3 for device C3\nEnter 4 for device D4\nEnter 5 for software updates\nEnter 9 to exit\n", (choice) => { 
		
		
		if(!checkInput(choice)){ //check input
			console.log("Incorrect");
			return selectDevice(); //try gain 
			
		}
		else{
			
			 //enter choice of method
			const num = parseInt(choice); //convert input into integer
		
			if(num===1){ //if input equals one go to readingNow method
				
				connect("A1");
				
			}
			else if(num===2){
				
				connect("B2");
			}
			else if(num===3){ //if input equals one go to readingNow method
				
				connect("C3");
				
			}
			else if(num===4){
				
				connect("D4");
				
			}
			else if(num===5){ //get server stream function 
				
				getUpdates();
				readline.close();
				
			}		
			else if(num===9){ //lets user exit 
				
				console.log("Exit");
				readline.close();
				return;
			}
			else{
				
				console.log("Try Again");
				selectDevice();
				
			}
		}		
					
	});
}	
function selectService(){ //simple stream,client stream, server stream bidirectional stream 
readline.question("\nSELECT SERVICES\nEnter 1 for current flow\nEnter 2 for average flow\nEnter 3 for live flow updates\nEnter 9 to exit\n", (choice) => {
	
	if(checkInput(choice)){ //enter choice of method
		const num = parseInt(choice); //convert input into integer
		
			if(num===1){ //if input equals one go to readingNow method
				
				readingNow();
				readline.close();
				
			}
			else if(num===2){
				
				readline.question("Enter duration of test in seconds: ",(inputDur) => { //asks users how long the reading should be
					if(checkInput(inputDur)){
					
						const dur=parseInt(inputDur);
						averageReading(dur);
						
					}
				});
				
			}
			else if(num===3){
				readline.question("Enter duration of test in seconds: ",(inputDur) => { 
					if(checkInput(inputDur)){
						const dur=parseInt(inputDur);
						waterMeterLive(dur);
						
					}
										
				});	
				
			}
			else if(num===9){
				
				console.log("Exit");
				readline.close();
				return;
				
			}	
			else{
		
				console.log("Try Again");
				return selectService()
				
			}
		}		
	
});
	
}

selectDevice();


