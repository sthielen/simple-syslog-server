// vim: set ft=javascript tabstop=4 softtabstop=4 shiftwidth=4 autoindent:
const dgram = require('dgram') ;
const debug = require('debug')('simple-syslog-server') ;
const util = require('util') ;
const ConnectionState = require('./ConnectionState') ;
const parser = require('./parser') ;

const SEVERITY = [
	'Emergency',
	'Alert',
	'Critical',
	'Error',
	'Warning',
	'Notice',
	'Informational',
	'Debug'
] ;

const FACILITY = [
	'kern',
	'user',
	'mail',
	'daemon',
	'auth',
	'syslog',
	'lpr',
	'news',
	'uucp',
	'cron',
	'authpriv',
	'ftp',
	'ntp',
	'logaudit',
	'logalert',
	'clock',
	'local0',
	'local1',
	'local2',
	'local3',
	'local4',
	'local5',
	'local6',
	'local7',
] ;

const SERVICE = {
	'UDP': UDP,
	'TCP': TCP,
	'TLS': TLS
} ;

/**
 * Factory function to create instances of syslog servers
 * @param {(net|tls|dgram)} transport Server constructor
 * @param {Object} [options={}] Options to pass to the syslog instance
 * @param {function=} cb Callback function for received messages
 * @return {(UDP|TCP|TLS)}
 */
function factory(transport, options, cb) {
	transport = transport.toUpperCase() ;
	if (transport in SERVICE)
		return SERVICE[transport].call(null, options, cb) ;

	throw new Error('Transport not supported: ' + transport) ;
}

module.exports = factory ;

function noop() {
}


/**
 * Given facility code, return its name
 * @param {number} code facility code
 * @return {string} facility name
 */
function facility(code) {
	if (code >= 0 && code <= 23)
		return FACILITY[code] ;
	else
		throw new Error('Invalid facility code: ' + code) ;
}

/**
 * Given severity code, return its name
 * @param {number} code severity code
 * @return {string} severity name
 */
function severity(code) {
	if (code >= 0 && code <= 7)
		return SEVERITY[code] ;
	else
		throw new Error('Invalid severity code: ' + code) ;

}

/**
 * @class
 * @classdesc Abstract class for all syslog servers
 * @constructor Abstract constructor for all syslog servers
 * @return {Transport}
 */
function Transport() {
}

/**
 * Register an event handler on the underlying server instance
 * @param {string} event event name
 * @param {function} cb callback function to call on event
 * @return {Transport}
 */
Transport.prototype.on = function(event, cb) {
	this.server.on(event, cb) ;
	return this ;
} ;

/**
 * Close the socket for this server
 * @param {function} cb callback function when socket closed
 * @return {Transport}
 */
Transport.prototype.close = function(cb) {
	cb = cb || noop ;
	this.server.close(cb) ;
	return this ;
} ;

/**
 * Start listening for messages
 * @param {Object} [options={}] Options to pass to the syslog instance
 * @param {function} cb callback function to call on return from listen
 * @abstract
 * @return {(UDP|TCP|TLS)}
 */
Transport.prototype.listen = function(options, cb) {
	throw new Error('must be implemented by subclass!') ;
} ;

/**
 * @class
 * @classdesc An instance of a UDP Syslog Server
 * @param {object} options Options to pass to the UDP Syslog Server
 * @param {function=} cb callback function when server receives a message
 * @return {UDP}
 * @constructor
 */
function UDP(options, cb) {
	if (!(this instanceof UDP))
		return new UDP(options, cb) ;

	this.opt = options || { type: 'udp4' } ;
	this.handler = cb || noop ;

	this.server = dgram.createSocket(this.opt) ;
}

util.inherits(UDP, Transport) ;

/**
 * Listen to IP/port for messages
 * @param {object} options Options for UDP.bind call
 * @param {function} cb callback function after listen (bind)
 * @return {UDP}
 */
UDP.prototype.listen = function(options, cb) {
	let server = this.server ;
	options = options || { port: 514 } ; // default is 514
	this.transport = options ;

	if (this.port) {
		debug('server has binded to %s', this.port) ;
		return ;
	}
	debug('try bind to %s', options.port) ;
	cb = cb || noop ;
	this.port = options.port ;

	server
	.on('error', err => {
		debug('binding error: %o', err) ;
		cb(err) ;
	})
	.on('listening', () => {
		debug('binding ok') ;
		cb(null) ;
	})
	.on('message', (msg, rinfo) => {
		let info = parser(msg, rinfo) ;
		this.handler(info) ;
	})
	.bind(options) ;

	return this ;
} ;

/*
 * SOCK_STREAM service
 */
const net = require('net') ;
const tls = require('tls') ;

/**
 * @class
 * @classdesc An instance of a TCP Syslog Server
 * @param {object} options Options to pass to the TCP Syslog Server
 * @param {function=} cb callback function when server receives a message
 * @return {TCP}
 * @constructor
 */
function TCP(options, cb) {
	if(this instanceof TCP)
		StreamService.call(this, net, options, cb) ;
	else
		return new TCP(options, cb) ;
}

util.inherits(TCP, StreamService) ;

/**
 * @class
 * @classdesc An instance of a TLS Syslog Server
 * @param {object} options Options to pass to the TLS Syslog Server
 * @param {function=} cb callback function when server receives a message
 * @return {TLS}
 * @constructor
 */
function TLS(options, cb) {
	if(this instanceof TLS)
		StreamService.call(this, tls, options, cb) ;
	else
		return new TLS(options, cb) ;
}

util.inherits(TLS, StreamService) ;

/**
 * @class
 * @classdesc An abstract class for streaming transports
 * @param {object} options Options to pass to the streaming transport
 * @param {function=} cb callback function when server receives a message
 * @return {(TCP|TLS)}
 * @constructor
 */
function StreamService(serviceModule, options, cb) {
	this.opt = options || {} ;
	this.handler = cb || noop ;
	this.connections = {} ;

	this.server = serviceModule.createServer(this.opt, (connection) => {
		let client = connection.remoteAddress + ':' + connection.remotePort ;
		this.connections[client] = connection ;
		debug('New connection from ' + client) ;
		let state = new ConnectionState(this, connection) ;
		connection.on('data', (buffer) => {
			state.more_data(buffer) ;
		}) ;
		connection.on('end', () => {
			state.closed() ;
			delete this.connections[client] ;
		}) ;
	}) ;
	return this ;
}

util.inherits(StreamService, Transport) ;

/**
 * Listen to IP/port for connections
 * @param {object} options Options for TCP/TLS.listen call
 * @param {function} cb callbback function after listen
 * @return {(TCP|TLS)}
 * @constructor
 */
StreamService.prototype.listen = function(options, cb) {
	let server = this.server ;
	cb = cb || noop ;
	options = options || { port: 514 } ; // default is 514
	this.transport = options ;
	this.port = options.port ;
	debug('Binding to ' + this.port) ;

	server
	.on('error', err => {
		debug('binding error: %o', err) ;
		cb(err) ;
	})
	.on('listening', () => {
		debug('tcp binding ok') ;
		this.transport.port = server.address().port ;
		this.port = server.address().port ;
		cb(null, this) ;
	})
	.listen(options) ;

	return this ;
} ;

/**
 * Close the listening socket and all connected clients for this server
 * @param {function} cb callback function when socket closed
 * @return {Transport}
 */
StreamService.prototype.close = function(cb) {
	Transport.prototype.close.call(this, cb) ;
	for (let c in this.connections)
		this.connections[c].end() ;

	this.connections = {} ;
	return this ;
} ;



module.exports.facility = facility ;
module.exports.severity = severity ;
module.exports.UDP = UDP ;
module.exports.TCP = TCP ;
module.exports.TLS = TLS ;
