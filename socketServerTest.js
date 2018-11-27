const SocketServer = require("./socketServer.js");
var socketServer = new SocketServer({
	"port":5050,
	"origin":"*",
	"socketConnect":function(res){
		console.log("Socket connected");
	},
	"socketDisconnect":function(res){
		console.log("Socket disconnect",res);
	},
	"socketAuth":function(msg,callback){
		// authenticate each message within socket
		if(msg) callback(true); 
	},
});
socketServer.setConfig({
	"allowRequest":function(socketId,token,callback){
		// authenticate initial message to socket
		if(token=="somesecretkey"){
			socketServer.socketIdMap[socketId]={"username":"admin"};
			callback({"username":"admin"});
		}else if(token=="somesecretkey2"){
			socketServer.socketIdMap[socketId]={"username":"admin2"};
			callback({"username":"admin2"});
		}
		else callback(false); 
	},
	"events":{
		"message":function(res,callback){
			console.log("Received this on message channel",res);
		},
		"cats":function(res,callback){
			console.log("Received this on cats channel",res);
			
			// reply to client who sent the message only
			callback({"data":"someotherkey"});
			
			// reply with message to EVERYONE on channel dogs
			console.log("Sending a message to all dogs");
			socketServer.sendMessage({"channel":"dogs","message":"hi"});
			setTimeout(function(){
				console.log("sending a message to only admin");
				socketServer.sendMessage({"channel":"dogs","message":"hi admin!!!!","to":["admin"]});
			},3000);
		}
	}
})
