var socketServer = function(config){
	// more functions, cheatsheet:
	// https://socket.io/docs/emit-cheatsheet/
	var fs = require("fs");
	var _this=this;
	var socketServer=this;
	var port = config.port || 6001;
	const server = require('http').createServer();
	var Redis = require('o-redis');
	this.redis = Redis.redis;
	this.oredis= new Redis();
 
	this.config=config || {};
	const io = require('socket.io')(server, {
		path: '/socket.io',
		serveClient: false,
		
		/*origins: config.origins || config.origin || "*",
		*/
		pingInterval: 10000,
		allowRequest:function(request,callback){
			/*var allow=true;
			if(typeof _this.config.allowRequest!="undefined"){
				// dont know what to do here yet
				//console.log("key is not null");
				_this.config.allowRequest(request,function(res){
					if(typeof res.error!="undefined")callback(403,false)
					else callback(200,true);
				});
			}else{
				console.log("Config accept request is undefined");*/
				callback(200,true);
			//}
			
		},
		pingTimeout: 5000,
		//cookie: false,
		wsEngine: "ws"
	});
	

	this.io=io;
	this.socketIdMap={};
	this.userIdMap={};
	function checkUserInt(message){
		
		return isInt
	}
	this.getUserObjFromMessage=function(message){
		console.log(message);
		console.log(_this.socketIdMap);
		console.log(_this.userIdMap);
		var user_id = _this.socketIdMap[message.socketId].id;
		var isInt = Number.isInteger(user_id);
		if(!isInt)return false;
		else{
			return _this.userIdMap[user_id];
		}
	}
	this.getUserObjectFromMessage=_this.getUserObjFromMessage;

	this.setUserObject=function(userObject){
		_this.userIdMap[userObject.id]=userObject;
	}
	this.setUserObj=_this.setUserObject;
	io.on('connection',function(socket){
		socket.on('auth',function(message,callback){
			var ret = {"socketId":socket.id};
			for(var key in message){
				ret[key]=message[key];
			}
			_this.config.allowRequest(ret,function(res){
				
				if(typeof res.error!="undefined" || !res){
					callback(res);	
					socket.disconnect();
				}
				else{
					var socketId = socket.id;
					if(typeof _this.userIdMap[res.id]=="undefined"){
						_this.userIdMap[res.id]=res;
					}
					_this.socketIdMap[socketId]=_this.userIdMap[res.id];
					callback(res);
					_this.config.socketConnect();
				}
			});	
		})
		socket.on('disconnect',function(from){
			socket.socketId=socket.id;
			_this.config.socketDisconnect(socket);
		});
		_this.assignEvents(socket);
	});

	this.addToStateObject=function(username,key,object){
		var clients = Object.keys(io.sockets.sockets);
		for(var client in clients){
			var socket = io.sockets.sockets[clients[client]];
			if(	username != _this.socketIdMap[socket.id].username &&
				username != socket.id &&
				username != _this.socketIdMap[socket.id].id
				) continue;
			var user_id = _this.socketIdMap[socket.id].id;
			_this.userIdMap[user_id][key]=object;
			break;
		}
	}
	this.sendMessage=function(message){
		// send a message to everyone
		var channel=message.channel || "all"
		var clients = Object.keys(io.sockets.sockets);
		for(var client in clients){
			var socket = io.sockets.sockets[clients[client]];
			if(typeof message.to!="undefined"){			
				if(typeof _this.socketIdMap[socket.id]=="undefined")continue;
				if(	message.to.indexOf(_this.socketIdMap[socket.id].username)==-1 &&
					message.to.indexOf(socket.id)==-1 &&
					message.to.indexOf(_this.socketIdMap[socket.id].id)==-1 
					) continue;
				var message2=JSON.parse(JSON.stringify(message));
				delete message2.to;
				socket.emit(channel,message);
			}else socket.emit(channel,message);
		}
	}
	console.log("http://localhost:"+port);
	server.listen(port);
	this.setConfig=function(config){
		for(var key in config){
			if(typeof config[key]==='object'){
				if(typeof _this.config[key]=="undefined")_this.config[key]=config[key];
				else{
					for(var key2 in config[key]){
						_this.config[key][key2]=config[key][key2]
					}
				}
			}else{
				_this.config[key]=config[key]
			}
		}
		_this.updateEvents();
	}
	this.assignEvents=function(socket){
		for(var key in _this.config.events){
			socket.on(key,function(msg,clientFunction){
				if(typeof msg.channel!="undefined")key=msg.channel;
				var go=true;
				if(typeof _this.config.events[key].socketAuth !="undefined"){
					go = _this.config.events[key].socketAuth(msg);
				}
				if(typeof _this.socketIdMap[socket.id]=="undefined"){
					go=false;
				}else{
					msg.socketId=socket.id;
				}
				if(go){
					msg.userObject = _this.getUserObjFromMessage(msg);
					msg.user=msg.userObject;
					_this.config.events[key](msg,function(response){
						//optional
						// call a function, on the client, using data from the server	
						// useful for ping pong
						//response.socketId=socket.id;
						//response.state=_this.socketIdMap[socket.id];
						
						if(typeof clientFunction!="undefined")clientFunction(response);
					});
				}else{
					socket.disconnect();
				}
			});
		}
	}
	this.updateEvents=function(){
		var clients = Object.keys(io.sockets.sockets);
		for(var client in clients){
			var socket = io.sockets.sockets[clients[client]];
			_this.assignEvents(socket);
		}
	}
	this.setConfig(config);

	this.exampleConfig={
		"port":5050,
		"origin":"*",
		"events":{
			"message":function(res,callback){
				console.log("Received this on message channel",res);
			},
			"cats":function(res,callback){
				console.log("Received this on cats channel",res);
				callback({"data":"someotherkey"});
			}
		},
		"socketConnect":function(res){
			console.log("Socket connected");
		},
		"socketDisconnect":function(res){
			console.log("Socket disconnect",res);
		},
		"socketAuth":function(msg,callback){
			// authenticate a message
			if(msg) callback(true); 
		}
	};
};
module.exports=socketServer;
