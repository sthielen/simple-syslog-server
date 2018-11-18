/* eslint-disable no-unused-vars,no-undef */
const dgram = require('dgram') ;
const assert = require('assert') ;
const mocha = require('mocha') ;
const Syslog = require('../src/') ;

describe('given the UDP transport name', () => {
	it('instantiates a UDP simple-syslog-server object', () => {
		let server = Syslog('UDP', null, info => {}) ;
		assert.ok(server instanceof Syslog.UDP) ;
	}) ;
}) ;

describe('given the TCP transport name', () => {
	it('instantiates a TCP simple-syslog-server object', () => {
		let server = Syslog('TCP', null, info => {}) ;
		assert.ok(server instanceof Syslog.TCP) ;
	}) ;
}) ;

describe('given the TLS transport name', () => {
	it('instantiates a TLS simple-syslog-server object', () => {
		let server = Syslog('TLS', null, info => {}) ;
		assert.ok(server instanceof Syslog.TLS) ;
	}) ;
}) ;
