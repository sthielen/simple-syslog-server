/* eslint-disable no-undef */
var assert = require('assert') ;
// eslint-disable-next-line no-unused-vars
var mocha = require( 'mocha' ) ;
var tls = require('tls') ;
var selfsigned = require( 'selfsigned' ) ;

var attributes = [{ name: 'commonName', value: 'localhost' }] ;
var x509 = selfsigned.generate( attributes, { days: 2 } ) ;

describe( 'given a TLS Syslog Server', () => {
	it( 'Receives TLS/TCP/IP messages', (done) => {
		const StreamSyslogd = require('../src/').TLS ;
		assert( StreamSyslogd, 'TLSStreamService not defined' ) ;

		var timestamp = 'Dec 15 10:58:44' ;
		var testMsg = '<183>' + timestamp + ' hostname tag: info' ;
		const port = 0 ;
		const options = {
			key: x509['private'],
			cert: x509['cert'],
			ca: [ x509['cert'] ]
		} ;

		var server = StreamSyslogd( info => {
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
		}, options ).listen( port, (err, service ) => { // sudo
			//This is required because NodeJS is really strange about self signed certificates.
			function identity_check( host, cert ){
				var cn = cert.subject.CN ;
				return host == cn ? undefined : new Error( 'subject mistmatch: host ${host} and CN ${cn}' ) ;
			}

			assert.ifError( err ) ;
			var buffer = new Buffer(testMsg) ;
			var client = tls.connect( service.port, 'localhost', { checkServerIdentity: identity_check, ca: [ x509['cert'] ] }, () => {
				// eslint-disable-next-line no-unused-vars
				client.write(buffer, (err, bytes) => {
					assert.ifError( err ) ;
					client.end() ;
				}) ;
			}) ;
		}) ;
	}) ;
}) ;

