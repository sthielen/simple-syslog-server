// vim: set ft=javascript tabstop=4 softtabstop=4 shiftwidth=4 autoindent:
var assert = require('assert') ;
let mocha = require( 'mocha' ) ;
let tls = require('tls') ;
let selfsigned = require( 'selfsigned' ) ;

let attributes = [{ name: 'commonName', value: 'localhost' }] ;
let x509 = selfsigned.generate( attributes, { days: 2 } ) ;

describe( 'given a TLS Syslog Server', () => {
	it( 'Receives TLS/TCP/IP messages', (done) => {
		const StreamSyslogd = require('../').TLSStreamService ;
		assert( StreamSyslogd, 'TLSStreamService not defined' ) ;

		var time = 'Dec 15 10:58:44' ;
		var testMsg = '<183>' + time + ' hostname tag: info' ;
		const port = 0 ;
		const options = {
			key: x509['private'],
			cert: x509['cert'],
			ca: [ x509['cert'] ]
		} ;

		StreamSyslogd(function(info) {
			info.port = null ; // port is random
			info.address = null ;
			info.family = null ;
			var shouldRet = {
				  facility: 7
				, severity: 22
				, tag: 'tag'
				, time: new Date(time + ' ' + new Date().getFullYear())
				, hostname: 'hostname'
				, address: null
				, family: null
				, port: null
				, size: testMsg.length
				, msg: 'info'
			} ;
			assert.deepEqual(shouldRet, info) ;
			done() ;
		}, options ).listen( port, function(err, service ) { // sudo
			//This is required because NodeJS is really strange about self signed certificates.
			function identity_check( host, cert ){
				let cn = cert.subject.CN ;
				return host == cn ? undefined : new Error( 'subject mistmatch: host ${host} and CN ${cn}' ) ;
			}

			assert.ifError( err ) ;
			var buffer = new Buffer(testMsg) ;
			var client = tls.connect( service.port, 'localhost', { checkServerIdentity: identity_check, ca: [ x509['cert'] ] }, function() {
				client.write(buffer, function(err, bytes) {
					assert.ifError( err ) ;
					client.end() ;
				}) ;
			}) ;
		}) ;
	}) ;
}) ;

