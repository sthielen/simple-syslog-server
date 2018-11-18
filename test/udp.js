/* eslint-disable no-unused-vars,no-undef */
const dgram = require('dgram') ;
const assert = require('assert') ;
const mocha = require('mocha') ;
const UdpSyslogServer = require('../src/').UDP ;

describe('given a simple-syslog-server', () => {
	it('receives and processes messages', (done) => {
		const timestamp = 'Dec 15 10:58:44' ;
		const testMsg = '<183>' + timestamp + ' hostname tag: info' ;
		const options = { port: 10514 } ;

		let server = UdpSyslogServer( null, info => {
			//console.log(info)
			info.port = null ; // port is random
			let shouldRet = {
				facility: 22,
				severity: 7,
				tag: 'tag',
				timestamp: new Date(timestamp + ' ' + new Date().getFullYear()),
				hostname: 'hostname',
				address: '127.0.0.1',
				family: 'IPv4',
				port: null,
				size: 39,
				msg: 'info'
			} ;
			assert.deepEqual(shouldRet, info) ;
			server.close() ;
			done() ;
		}).listen(options, err => { // sudo
			if(err)
				console.log('listen', err) ;
			assert(!err) ;
			let client = dgram.createSocket('udp4') ;
			let buffer = new Buffer(testMsg) ;
			client.send(buffer, 0, buffer.length, options.port, 'localhost', (err, bytes) => {
				//console.log('send', err, bytes)
			}) ;
		}) ;
	}) ;
}) ;
