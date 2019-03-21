// app-commands.js
// ========
var benchmarks = ["Gson","Xstream","CommonsMath"];

function createDirIfNotExists(fs,dir){
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
}
function callStartApp(http,myPort){
	http.get({host:'localhost', port:myPort, path:'/start'},function(resp){}).on("error",function(e){console.log(e.message)});
}
function logData(exec,adbCommandStrings,sessionData,fs,callback) {
	var fileName = sessionData.currentTest+"-"+sessionData.device+"-"+sessionData.counter.current+".txt";
	createDirIfNotExists(fs,'experiment-results');
	createDirIfNotExists(fs,'experiment-results/'+sessionData.device);
	var dir = 'experiment-results/' + sessionData.device + '/' + sessionData.currentTest;
	createDirIfNotExists(fs,dir);
	if(callback)
		exec(adbCommandStrings.outputBatteryStatsTo(dir+'/'+fileName),function(error,stdout,stderr){
			fs.appendFile(dir+'/'+fileName,"\r\nNumber of warm-up Iterations:"+sessionData.nWarmUpIterations+
				"\r\nNumber of iterations:"+sessionData.nIterations);
			callback();
		});
	else {
		fs.appendFile(dir+'/'+fileName,"\r\nNumber of warm-up Iterations:"+sessionData.nWarmUpIterations+
				"\r\nNumber of iterations:"+sessionData.nIterations);
		exec(adbCommandStrings.outputBatteryStatsTo(dir+'/'+fileName));
	}
}
module.exports = {
	benchmarks : function() {
		return benchmarks;
	},
	whatNow : function(exec,adbCommandStrings,sessionData,res){
		exec(adbCommandStrings.cleanBatteryStats, function(error, stdout, stderr) {
		  	res.send(sessionData.currentTest);	
		 });
	},
	logdata : function(exec,adbCommandStrings,sessionData,res,http,fs,myPort){
		logData(exec,adbCommandStrings,sessionData,fs);
		res.send("logged");
	},
	done : function(exec,adbCommandStrings,sessionData,res,http,fs,myPort){
		logData(exec,adbCommandStrings,sessionData,fs,function(){
			exec(adbCommandStrings.cleanBatteryStats);
			res.send("done");
			sessionData.counter.current++;
			if( (sessionData.counter.current<=sessionData.counter.until) && (!sessionData.stop) ){
				setTimeout(function(){callStartApp(http,myPort)},3000);
			} 
			exec(adbCommandStrings.killApp(sessionData.applicationId));
		});
	},
	cleanbattery : function(exec,adbCommandStrings,res){
		exec(adbCommandStrings.cleanBatteryStats);
		res.send("cleaned");
	}
}
