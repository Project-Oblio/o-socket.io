var socketServer = function(envDir){
	var dotenv=require('dotenv');var fs = require("fs");
	var port = 6001;
	const express = require('express')
	const app = express()
	app.use(cors());


	app.listen(port, () => console.log('app listening on '+port+'!'))
});
