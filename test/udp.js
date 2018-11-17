/* eslint-disable no-unused-vars,no-undef */
var dgram = require('dgram') ;
var assert = require('assert') ;
var mocha = require('mocha') ;
var Syslog = require('../src/') ;

describe('given a simple-syslog-server', () => {
	it('receives and processes messages', (done) => {
		var time = 'Dec 15 10:58:44' ;
		var testMsg = '<183>' + time + ' hostname tag: info' ;
		const port = 10514 ;

		var server = Syslog.UDP( info => {
			//console.log(info)
			info.port = null ; // port is random
			var shouldRet = {
				facility: 22,
				severity: 7,
				tag: 'tag',
				time: new Date(time + ' ' + new Date().getFullYear()),
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
		}).listen(port, err => { // sudo
			console.log('listen', err) ;
			assert(!err) ;
			var client = dgram.createSocket('udp4') ;
			var buffer = new Buffer(testMsg) ;
			client.send(buffer, 0, buffer.length, port, 'localhost', (err, bytes) => {
				//console.log('send', err, bytes)
			}) ;
		}) ;
	}) ;
}) ;
