/* eslint-disable no-unused-vars,no-undef */
var assert = require('assert') ;
var mocha = require( 'mocha' ) ;
var net = require('net') ;

describe( 'given a TCP Syslog Server', () => {
	it( 'Receives TCP/IP messages', (done) => {
		const StreamSyslogd = require('../src/').TCP ;
		assert( StreamSyslogd, 'StreamService not defined' ) ;

		var timestamp = 'Dec 15 10:58:44' ;
		var testMsg = '<183>' + timestamp + ' hostname tag: info' ;
		const options = { port: 0 } ;

		var server = StreamSyslogd(null, function(info) {
			info.port = null ; // port is random
			info.address = null ;
			info.family = null ;
			var shouldRet = {
				facility: 22,
				severity: 7,
				tag: 'tag',
				timestamp: new Date(timestamp + ' ' + new Date().getFullYear()),
				hostname: 'hostname',
				address: null,
				family: null,
				port: null,
				size: testMsg.length,
				msg: 'info'
			} ;
			assert.deepEqual(shouldRet, info) ;
			server.close() ;
			done() ;
		}).listen( options, (err, service ) => { // sudo
			assert.ifError( err ) ;
			var buffer = new Buffer(testMsg) ;
			var client = net.connect( options, function() {
				client.write(buffer, (err, bytes) => {
					assert.ifError( err ) ;
					client.end() ;
				}) ;
			}) ;
		}) ;
	}) ;
}) ;

