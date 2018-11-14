/* eslint-disable no-unused-vars,no-undef */
var dgram = require('dgram') ;
var assert = require('assert') ;
let mocha = require('mocha') ;
var Syslogd = require('../src/') ;

describe('given the UDP transport name', () => {
	it('instantiates a UDP syslogd object', () => {
		var server = Syslogd('UDP', function(info) {}) ;
		assert.ok(server instanceof Syslogd.UDP) ;
	}) ;
}) ;

describe('given the TCP transport name', () => {
	it('instantiates a TCP syslogd object', () => {
		var server = Syslogd('TCP', function(info) {}) ;
		assert.ok(server instanceof Syslogd.TCP) ;
	}) ;
}) ;

describe('given the TLS transport name', () => {
	it('instantiates a TLS syslogd object', () => {
		var server = Syslogd('TLS', function(info) {}) ;
		assert.ok(server instanceof Syslogd.TLS) ;
	}) ;
}) ;
