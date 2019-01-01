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

/* eslint-disable no-unused-vars,no-undef */
const dgram = require('dgram') ;
const assert = require('assert') ;
const mocha = require('mocha') ;
const SyslogServer = require('../src/') ;

describe('given the UDP transport name', () => {
	it('instantiates a UDP simple-syslog-server object', () => {
		let server = SyslogServer('UDP', null, info => {}) ;
		assert.ok(server instanceof SyslogServer.UDP) ;
	}) ;
}) ;

describe('given the TCP transport name', () => {
	it('instantiates a TCP simple-syslog-server object', () => {
		let server = SyslogServer('TCP', null, info => {}) ;
		assert.ok(server instanceof SyslogServer.TCP) ;
	}) ;
}) ;

describe('given the TLS transport name', () => {
	it('instantiates a TLS simple-syslog-server object', () => {
		let server = SyslogServer('TLS', null, info => {}) ;
		assert.ok(server instanceof SyslogServer.TLS) ;
	}) ;
}) ;
