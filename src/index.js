// vim: set ft=javascript tabstop=4 softtabstop=4 shiftwidth=4 autoindent:
var dgram = require('dgram') ;
var debug = require('debug')('simple-syslog-server') ;
var util = require('util') ;
var ConnectionState = require('./ConnectionState') ;
var parser = require('./parser') ;

var SEVERITY = [
	'Emergency',
	'Alert',
	'Critical',
	'Error',
	'Warning',
	'Notice',
	'Informational',
	'Debug'
] ;

var FACILITY = [
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

var SERVICE = {
	'UDP': UDP,
	'TCP': TCP,
	'TLS': TLS
} ;

function factory(transport) {
	var args = Array.from(arguments) ;
	// Throw away transport
	args.shift() ;
	transport = transport.toUpperCase() ;
	if (transport in SERVICE)
		return SERVICE[transport].apply(null, args) ;

	throw new Error('Transport not supported: ' + transport) ;
}

module.exports = factory ;

function noop() {
}

function facility(code) {
	if (code >= 0 && code <= 23)
		return FACILITY[code] ;
	else
		throw new Error('Invalid facility code: ' + code) ;
}

function severity(code) {
	if (code >= 0 && code <= 7)
		return SEVERITY[code] ;
	else
		throw new Error('Invalid severity code: ' + code) ;

}

function Transport() {
}

Transport.prototype.on = function(event, cb) {
	this.server.on(event, cb) ;
	return this ;
} ;

Transport.prototype.close = function(callback) {
	this.server.close(callback) ;
} ;


function UDP(fn, opt) {
	if (!(this instanceof UDP))
		return new UDP(fn, opt) ;

	this.opt = opt || {} ;
	this.handler = fn ;

	this.server = dgram.createSocket('udp4') ;
}

util.inherits(UDP, Transport) ;

UDP.prototype.listen = function(port, cb) {
	var server = this.server ;
	if (this.port) {
		debug('server has binded to %s', port) ;
		return ;
	}
	debug('try bind to %s', port) ;
	cb = cb || noop ;
	this.port = port || 514 ; // default is 514

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
		var info = parser(msg, rinfo) ;
		this.handler(info) ;
	})
	.bind(port, this.opt.address) ;

	return this ;
} ;

/*
 * SOCK_STREAM service
 */
const net = require('net') ;
const tls = require('tls') ;

function TCP(callback, options) {
	if(this instanceof TCP)
		StreamService.call(this, net, callback, options) ;
	else
		return new TCP(callback, options) ;
}

util.inherits(TCP, StreamService) ;

function TLS(callback, options) {
	if(this instanceof TLS)
		StreamService.call(this, tls, callback, options) ;
	else
		return new TLS(callback, options) ;
}

util.inherits(TLS, StreamService) ;

function StreamService(serviceModule, fn, opt) {
	this.opt = opt || {} ;
	this.handler = fn ;
	this.connections = {} ;

	this.server = serviceModule.createServer(this.opt, (connection) => {
		var client = connection.remoteAddress + ':' + connection.remotePort ;
		this.connections[client] = connection ;
		debug('New connection from ' + client) ;
		var state = new ConnectionState(this, connection) ;
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

StreamService.prototype.listen = function(port, callback) {
	var server = this.server ;
	callback = callback || noop ;
	this.port = port || 514 ; // default is 514
	debug('Binding to ' + this.port) ;

	server
	.on('error', err => {
		debug('binding error: %o', err) ;
		callback(err) ;
	})
	.on('listening', () => {
		debug('tcp binding ok') ;
		this.port = server.address().port ;
		callback(null, this) ;
	})
	.listen(port, this.opt.address) ;

	return this ;
} ;

StreamService.prototype.close = function(callback) {
	Transport.prototype.close.call(this, callback) ;
	for (var c in this.connections) 
		this.connections[c].end() ;

	this.connections = {} ;
} ;



module.exports.facility = facility ;
module.exports.severity = severity ;
module.exports.UDP = UDP ;
module.exports.TCP = TCP ;
module.exports.TLS = TLS ;
