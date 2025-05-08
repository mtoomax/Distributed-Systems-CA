const winston = require('winston'); //winston logging library import
const logger = winston.createLogger({ //logger instance
	level: 'info', //minimum level
	//log format including timestamp
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.printf(
			({ timestamp, level, message})=> `[${timestamp}] ${level.toUpperCase()}: ${message}`
		)
	),
	//Output logs to console and a signal.log folder under logs folder
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'logs/signal.log'})
	],
});
module.exports = logger;
