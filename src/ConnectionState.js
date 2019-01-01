const FrameParser = require('./FrameParser') ;
const parser = require('./parser') ;
const debug = require('debug')('simple-syslog-server') ;
const validate = require('./validate') ;

function ConnectionState(service, connection) {
	this.service = service ;
	this.connection = connection ;

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
	let clientInfo = {
		address: this.info.address,
		family: this.info.family,
		port: this.info.port,
		size: frame.length
	} ;
	debug(`raw:${frame}`) ;
	try {
		let message = parser(frame, clientInfo) ;
		if(validate(message))
			this.connection.server.emit('msg', message) ;
		else
			this.connection.server.emit('invalid', message) ;
	}
	catch(err) {
		this.connection.server.emit('invalid', err) ;
	}
} ;

ConnectionState.prototype.closed = function() {
	this.frameParser.done() ;
	delete this.connection ;
} ;

module.exports = ConnectionState ;
