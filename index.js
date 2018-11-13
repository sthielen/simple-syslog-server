// vim: set ft=javascript tabstop=4 softtabstop=4 shiftwidth=4 autoindent:
var dgram = require('dgram') ;
var debug = require('debug')('syslogd') ;

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
	'kernel messages',
	'user-level messages',
	'mail system',
	'system daemons',
	'security/authorization messages',
	'messages generated internally by syslogd',
	'line printer subsystem',
	'network news subsystem',
	'UUCP subsystem',
	'clock daemon (note 2)',
	'security/authorization messages (note 1)',
	'FTP daemon',
	'NTP subsystem',
	'log audit (note 1)',
	'log alert (note 1)',
	'clock daemon (note 2)',
	'local use 0  (local0)',
	'local use 1  (local1)',
	'local use 2  (local2)',
	'local use 3  (local3)',
	'local use 4  (local4)',
	'local use 5  (local5)',
	'local use 6  (local6)',
	'local use 7  (local7)'
] ;

var SERVICE = {
	'UDP': UDP,
	'TCP': TCP,
	'TLS': TLS
} ;

function factory(transport) {
	if(transport in SERVICE)
		return SERVICE[transport] ;

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

function UDP(fn, opt) {
	if (!(this instanceof UDP))
		return new UDP(fn, opt) ;

	this.opt = opt || {} ;
	this.handler = fn ;

	this.server = dgram.createSocket('udp4') ;
}

UDP.prototype.listen = function(port, cb) {
	var server = this.server ;
	if (this.port) {
		debug('server has binded to %s', port) ;
		return ;
	}
	debug('try bind to %s', port) ;
	cb = cb || noop ;
	this.port = port || 514 ; // default is 514
	var me = this ;
	server
	.on('error', function(err) {
		debug('binding error: %o', err) ;
		cb(err) ;
	})
	.on('listening', function() {
		debug('binding ok') ;
		cb(null) ;
	})
	.on('message', function(msg, rinfo) {
		var info = parser(msg, rinfo) ;
		me.handler(info) ;
	})
	.bind(port, this.opt.address) ;

	return this ;
} ;

UDP.prototype.close = function(callback) {
	this.server.close(callback) ;
} ;

function parsePRI(raw) {
	// PRI means Priority, includes Facility and Severity
	// e.g. 00110111 =  facility: 00110, severity: 111
	// e.g. facility = 6, severity=7

	// To reverse
	// Grab last 3 bits
	var severity = parseInt(raw) % 8 ;
	// Shift last 3 bits to right (and throw away)
	var facility = parseInt(raw) >> 3 ;
	return [facility, severity] ;
}

// TODO Optimise parser https://sematext.com/blog/what-is-syslog-daemons-message-formats-and-protocols/
function parser(msg, rinfo) {
	// https://tools.ietf.org/html/rfc5424
	// e.g. <PRI>time hostname tag: info
	msg = msg + '' ;
	var tagIndex = msg.indexOf(': ') ;
	if (tagIndex == -1) {
		return {
			facility: undefined,
			severity: undefined,
			tag: undefined,
			time: new Date(),
			hostname: undefined,
			address: rinfo.address,
			family: rinfo.family,
			port: rinfo.port,
			size: rinfo.size,
			msg: msg
		} ;
	}
	else {
		var format = msg.substr(0, tagIndex) ;
		var priIndex = format.indexOf('>') ;
		var pri = format.substr(1, priIndex - 1) ;
		pri = parsePRI(pri) ;
		var lastSpaceIndex = format.lastIndexOf(' ') ;
		var tag = format.substr(lastSpaceIndex + 1) ;
		var last2SpaceIndex = format.lastIndexOf(' ', lastSpaceIndex - 1) ; // hostname cannot contain ' '
		var hostname = format.substring(last2SpaceIndex + 1, lastSpaceIndex) ;
		// time is complex because don't know if it has year
		var time = format.substring(priIndex + 1, last2SpaceIndex) ;
		time = new Date(time) ;
		time.setYear(new Date().getFullYear()) ; // fix year to now
		return {
			facility: pri[0]
			, severity: pri[1]
			, tag: tag
			, time: time
			, hostname: hostname
			, address: rinfo.address
			, family: rinfo.family
			, port: rinfo.port
			, size: rinfo.size
			, msg: msg.substr(tagIndex + 2)
		} ;
	}
}

module.exports.parser = parser ;

/*
 * SOCK_STREAM service
 */
const net = require('net') ;
const tls = require('tls') ;

function TCP(messageReceived, options) {
	return new StreamService(net, messageReceived, options) ;
}

function TLS(messageReceived, options) {
	return new StreamService(tls, messageReceived, options) ;
}

function StreamService(serviceModule, fn, opt) {
	this.opt = opt || {} ;
	this.handler = fn ;

	this.server = serviceModule.createServer(this.opt, (connection) => {
		debug('New connection from ' + connection.remoteAddress + ':' + connection.remotePort) ;
		let state = new ConnectionState(this, connection) ;
		this.emit('connection', {connection, state}) ;
		connection.on('data', (buffer) => {
			state.more_data(buffer) ;
		}) ;
		connection.on('end', () => {
			state.closed() ;
		}) ;
	}) ;
	return this ;
}

const util = require('util') ;
const EventEmitter = require('events') ;
util.inherits(StreamService, EventEmitter) ;

StreamService.prototype.listen = function(port, callback) {
	var server = this.server ;
	callback = callback || noop ;
	this.port = port || 514 ; // default is 514
	debug('Binding to ' + this.port) ;
	var me = this ;
	server
	.on('error', function(err) {
		debug('binding error: %o', err) ;
		callback(err) ;
		// me.emit('error', {address: me.opt.address});
	})
	.on('listening', function() {
		debug('tcp binding ok') ;
		me.port = server.address().port ;
		callback(null, me) ;
		// me.emit('listening', {port: port, address: me.opt.address})
	})
	.listen(port, this.opt.address) ;

	return this ;
} ;

StreamService.prototype.close = function(callback) {
	this.server.close(callback) ;
} ;

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
	let clientInfo = {
		address: this.info.address,
		family: this.info.family,
		port: this.info.port,
		size: frame.length
	} ;
	console.log(`raw:${frame}`) ;
	let message = parser(frame, clientInfo) ;
	this.service.handler(message) ;
} ;

ConnectionState.prototype.closed = function() {
	this.frameParser.done() ;
} ;

let FRAME_TYPE_UNKNOWN = 0 ;
let FRAME_TYPE_NEWLINE = 1 ;
let FRAME_TYPE_OCTET = 2 ;

function FrameParser(callback) {
	this.buffer = Buffer.from('') ;
	this.callback = callback ;
	this.frame_state = FRAME_TYPE_UNKNOWN ;
}

FrameParser.prototype.feed = function(data) {
	this.buffer = Buffer.concat([this.buffer, data]) ;
	this.check_framing() ;
} ;

FrameParser.prototype.done = function() {
	if (this.buffer.length > 0)
		this.callback(this.buffer.toString()) ;

	this.buffer = Buffer.from('', 'UTF-8') ;
} ;

FrameParser.prototype.check_framing = function() {
	let continue_digesting ;
	do {
		if (this.frame_state == FRAME_TYPE_UNKNOWN)
			continue_digesting = this.decide_on_frame_type() ;
		else if (this.frame_state == FRAME_TYPE_NEWLINE)
			continue_digesting = this.check_newline_framing() ;
		else if (this.frame_state == FRAME_TYPE_OCTET)
			continue_digesting = this.check_octet_frame() ;
		else
			throw 'Invalid frame state' ;

	} while (continue_digesting);
} ;

FrameParser.prototype.decide_on_frame_type = function() {
	// do nothing if buffer is too short
	if (this.buffer.length < 8)
		return false ;

	// shrink our check buffer
	let check = this.buffer.slice(0, 8) ;
	// Do we have spaces?
	let space = check.indexOf(' ') ;
	if (space == -1) {
		this.frame_state = FRAME_TYPE_NEWLINE ;
		return true ;
	}

	// Check output if we can convert it to a number
	let size = parseInt(check.slice(0, space), 10) ;
	if (isNaN(size) || size < 2) {
		this.frame_state = FRAME_TYPE_NEWLINE ;
		return true ;
	}

	// Octet framing
	this.octets = size ;
	this.frame_state = FRAME_TYPE_OCTET ;
	this.buffer = this.buffer.slice(space + 1) ;
	return true ;
} ;

FrameParser.prototype.check_newline_framing = function() {
	let indexOfNewLine = this.buffer.indexOf('\n') ;
	if (indexOfNewLine == -1) return false ;

	const frame = this.buffer.slice(0, indexOfNewLine) ;
	this.buffer = this.buffer.slice(indexOfNewLine + 1) ;

	return this._emit_and_reset(frame) ;
} ;

FrameParser.prototype.check_octet_frame = function() {
	let size = this.octets ;
	if (!size) throw 'Not currently in octet strategy' ;

	if (this.buffer.length < size) return false ;

	let frame = this.buffer.slice(0, size) ;
	this.buffer = this.buffer.slice(size) ;

	return this._emit_and_reset(frame) ;
} ;

FrameParser.prototype._emit_and_reset = function(frame) {
	this.callback(frame.toString('utf-8')) ;

	this.frame_state = FRAME_TYPE_UNKNOWN ;
	return true ;
} ;

module.exports.facility = facility ;
module.exports.severity = severity ;
module.exports.UDP = UDP ;
module.exports.TCP = TCP ;
module.exports.TLS = TLS ;

module.exports.FrameParser = FrameParser ;
module.exports.ConnectionState = ConnectionState ;
