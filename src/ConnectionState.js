var FrameParser = require('./FrameParser') ;
var parser = require('./parser') ;
var debug = require('debug')('syslogd') ;

function ConnectionState(service, connection) {
	this.service = service ;
	this.info = {
		address: connection.remoteAddress,
		family: connection.remoteFamily,
		port: connection.remotePort
	} ;
	this.frameParser = new FrameParser((frame) => {
		this.dispatch_message(frame) ;
	}) ;
}

ConnectionState.prototype.more_data = function(buffer) {
	this.frameParser.feed(buffer) ;
} ;

ConnectionState.prototype.dispatch_message = function(frame) {
	var clientInfo = {
		address: this.info.address,
		family: this.info.family,
		port: this.info.port,
		size: frame.length
	} ;
	debug(`raw:${frame}`) ;
	var message = parser(frame, clientInfo) ;
	this.service.handler(message) ;
} ;

ConnectionState.prototype.closed = function() {
	this.frameParser.done() ;
} ;

module.exports = ConnectionState ;
