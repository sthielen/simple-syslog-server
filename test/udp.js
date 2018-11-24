/* eslint-disable no-unused-vars,no-undef */
const dgram = require('dgram') ;
const assert = require('assert') ;
const mocha = require('mocha') ;
const SyslogServer = require('../src/') ;

describe('given a simple-syslog-server', () => {
	it('receives and processes messages', (done) => {
		const timestamp = 'Dec 15 10:58:44' ;
		const testMsg = '<183>' + timestamp + ' hostname tag: info' ;
		const options = { port: 10514 } ;

		let server = SyslogServer.UDP( null, info => {
		}) ;
		server.on('msg', info => {
			//console.log(info)
			info.port = null ;
			let shouldRet = {
				facility: 'local6',
				facilityCode: 22,
				severity: 'debug',
				severityCode: 7,
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
			server.close()
			.then(() => done()) ;
		})
		.listen(options)
		.then(sock => {
			var client = dgram.createSocket('udp4') ;
			var buffer = new Buffer(testMsg) ;
			client.send(buffer, 0, buffer.length, options.port, 'localhost', (err, bytes) => {
				//console.log('send', err, bytes)
			}) ;
		})
		.catch(err => { // sudo
			assert(false, err) ;
			done() ;
		}) ;
	}) ;
}) ;
