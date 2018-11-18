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

function factory(transport, options, cb) {
	transport = transport.toUpperCase() ;
	if (transport in SERVICE)
		return SERVICE[transport].call(null, options, cb) ;

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

Transport.prototype.close = function(cb) {
	cb = cb || noop ;
	this.server.close(cb) ;
} ;


function UDP(options, cb) {
	if (!(this instanceof UDP))
		return new UDP(options, cb) ;

	this.opt = options || {} ;
	this.handler = cb || noop ;

	this.server = dgram.createSocket('udp4') ;
}

util.inherits(UDP, Transport) ;

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

function TCP(options, cb) {
	if(this instanceof TCP)
		StreamService.call(this, net, options, cb) ;
	else
		return new TCP(options, cb) ;
}

util.inherits(TCP, StreamService) ;

function TLS(options, cb) {
	if(this instanceof TLS)
		StreamService.call(this, tls, options, cb) ;
	else
		return new TLS(options, cb) ;
}

util.inherits(TLS, StreamService) ;

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

StreamService.prototype.close = function(cb) {
	Transport.prototype.close.call(this, cb) ;
	for (let c in this.connections)
		this.connections[c].end() ;

	this.connections = {} ;
} ;



module.exports.facility = facility ;
module.exports.severity = severity ;
module.exports.UDP = UDP ;
module.exports.TCP = TCP ;
module.exports.TLS = TLS ;
