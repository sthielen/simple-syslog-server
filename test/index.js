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
