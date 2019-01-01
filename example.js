
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

const Syslog = require('./src') ;

// Create our syslog server with the given transport
const socktype = 'TCP' ; // or 'TCP' or 'TLS'
const address = '' ; // Any
const port = 20514 ;
var server = Syslog(socktype) ;

// State Information
var listening = false ;
var clients = [] ;
var count = 0 ;

server.on('msg', data => {
	console.log('message received (%i) from %s:%i\n%o\n', ++count, data.address, data.port, data) ;
	/*
	message received (1) from ::ffff:192.168.1.13:59666
	{
	  "facility": "daemon",
	  "facilityCode": 3,
	  "severity": "info",
	  "severityCode": 6,
	  "tag": "systemd[1]",
	  "timestamp": "2018-12-26T17:53:57.000Z",
	  "hostname": "localhost",
	  "address": "::ffff:192.168.1.13",
	  "family": "IPv6",
	  "port": 20514,
	  "size": 80,
	  "msg": "Started Daily apt download activities."
	}
	*/
})
.on('invalid', err => {
	console.warn('Invalid message format received: %o\n', err) ;
})
.on('error', err => {
	console.warn('Client disconnected abruptly: %o\n', err) ;
})
.on('connection', s => {
	let addr = s.address().address ;
	console.log(`Client connected: ${addr}\n`) ;
	clients.push(s) ;
	s.on('end', () => {
		console.log(`Client disconnected: ${addr}\n`) ;
		let i = clients.indexOf(s) ;
		if(i !== -1)
			clients.splice(i, 1) ;
	}) ;
})
.listen({host: address, port: port})
.then(() => {
	listening = true ;
	console.log(`Now listening on: ${address}:${port}`) ;
})
.catch(err => {
	if ((err.code == 'EACCES') && (port < 1024)) {
		console.error('Cannot listen on ports below 1024 without root permissions. Select a higher port number: %o', err) ;
	}
	else { // Some other error so attempt to close server socket
		console.error(`Error listening to ${address}:${port} - %o`, err) ;
		try {
			if(listening)
				server.close() ;
		}
		catch (err) {
			console.warn(`Error trying to close server socket ${address}:${port} - %o`, err) ;
		}
	}
}) ;
