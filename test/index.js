/* eslint-disable no-unused-vars,no-undef */
var dgram = require('dgram') ;
var assert = require('assert') ;
var mocha = require('mocha') ;
var Syslog = require('../src/') ;

describe('given the UDP transport name', () => {
	it('instantiates a UDP simple-syslog-server object', () => {
		var server = Syslog('UDP', info => {}) ;
		assert.ok(server instanceof Syslog.UDP) ;
	}) ;
}) ;

describe('given the TCP transport name', () => {
	it('instantiates a TCP simple-syslog-server object', () => {
		var server = Syslog('TCP', info => {}) ;
		assert.ok(server instanceof Syslog.TCP) ;
	}) ;
}) ;

describe('given the TLS transport name', () => {
	it('instantiates a TLS simple-syslog-server object', () => {
		var server = Syslog('TLS', info => {}) ;
		assert.ok(server instanceof Syslog.TLS) ;
	}) ;
}) ;
