/*
 * MIT License
 *
 * Copyright (c) 2019 Damien Clark (damo.clarky@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
 * OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
 * OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* eslint-disable no-undef */
const assert = require('assert') ;
// eslint-disable-next-line no-unused-vars
const mocha = require('mocha') ;
const tls = require('tls') ;
const selfsigned = require('selfsigned') ;

let attributes = [{ name: 'commonName', value: 'localhost' }] ;
let x509 = selfsigned.generate( attributes, { days: 2 } ) ;

describe( 'given a TLS Syslog Server', () => {
	it( 'Receives TLS/TCP/IP messages', (done) => {
		const TlsSyslogServer = require('../src/').TLS ;
		assert( TlsSyslogServer, 'TLSStreamService not defined' ) ;

		const timestamp = 'Dec 15 10:58:44' ;
		const testMsg = '<183>' + timestamp + ' hostname tag: info' ;
		const options = { port: 0 } ;
		const tls_options = {
			key: x509['private'],
			cert: x509['cert'],
			ca: [ x509['cert'] ]
		} ;

		let server = TlsSyslogServer(tls_options) ;
		server.on('msg', info => {
			info.port = null ; // port is random
			info.address = null ;
			info.family = null ;
			let shouldRet = {
				facility: 'local6',
				facilityCode: 22,
				severity: 'debug',
				severityCode: 7,
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
			server.close()
			.then(() => done()) ;
		})
		.listen(options)
		.then(service => {
			//This is required because NodeJS is really strange about self signed certificates.
			function identity_check( host, cert ){
				let cn = cert.subject.CN ;
				return host == cn ? undefined : new Error('subject mistmatch: host ${host} and CN ${cn}') ;
			}

			let buffer = new Buffer(testMsg) ;
			let client = tls.connect( service.port, 'localhost', { checkServerIdentity: identity_check, ca: [ x509['cert'] ] }, () => {
				// eslint-disable-next-line no-unused-vars
				client.write(buffer, (err, bytes) => {
					assert.ifError( err ) ;
					client.end() ;
				}) ;
			}) ;
		})
		.catch(err => {
			assert.ifError(err) ;
		}) ;
	}) ;
}) ;

