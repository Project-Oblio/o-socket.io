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
	var origin="*:*";
	if(typeof config.origin!="undefined")origin=config.origin;
	const io = require('socket.io')(server, {
		path: '/socket.io',
		serveClient: false,
		
		origins: origin,
		
		pingInterval: 10000,
		allowRequest:function(request,callback){
			/*var allow=true;
			if(typeof _this.config.allowRequest!="undefined"){
				// dont know what to do here yet
				
				_this.config.allowRequest(request,function(res){
					if(typeof res.error!="undefined")callback(403,false)
					else callback(200,true);
				});
			}else{
				*/
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
				
				if(typeof res.error!="undefined" || !res || typeof res.disconnect!="undefined"){
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
		var channel=message.channel || message.key ||  "all"
		var clients = Object.keys(io.sockets.sockets);
		for(var client in clients){
			var socket = io.sockets.sockets[clients[client]];
			if(typeof message.to!="undefined"){
				message.to+='';			
				if(typeof _this.socketIdMap[socket.id]=="undefined")continue;
				var to;
				if(typeof message.to=="Object"){
					if(typeof message.user.id!="undefined")to=message.user.id;
					else if(typeof message.user.username!="undefined")to=message.user.username
					else to=message.to;
				}else{
					to=message.to;
				}
				to=to+''; // convert whatever it is to a string;
				if(	to.indexOf(_this.socketIdMap[socket.id].username)==-1 &&
					to.indexOf(socket.id)==-1 &&
					to.indexOf(_this.socketIdMap[socket.id].id)==-1 
					){
					
					 continue;
				}
				var message2=JSON.parse(JSON.stringify(message));
				delete message2.to;
				socket.emit(channel,message2);
			}else socket.emit(channel,message);
		}
	}
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
				
			},
			"cats":function(res,callback){
				
				callback({"data":"someotherkey"});
			}
		},
		"socketConnect":function(res){
			
		},
		"socketDisconnect":function(res){
			
		},
		"socketAuth":function(msg,callback){
			// authenticate a message
			if(msg) callback(true); 
		}
	};
};
module.exports=socketServer;
