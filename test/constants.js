/* eslint-disable no-unused-vars,no-undef */
var dgram = require('dgram') ;
var assert = require('assert') ;
let mocha = require('mocha') ;
var Syslogd = require('../src/') ;

describe('given severity codes', () => {
	it('returns the correct description', () => {

		var SEVERITY = [
			'Emergency',
			'Alert',
			'Critical',
			'Error',
			'Warning',
			'Notice',
			'Informational',
			'Debug'
		] ;

		SEVERITY.forEach((severity, code) => {
			assert.equal(Syslogd.severity(code), severity) ;
		}) ;
	}) ;
}) ;

describe('given facility codes', () => {
	it('returns the correct description', () => {

		var FACILITY = [
			'kernel messages',
			'user-level messages',
			'mail system',
			'system daemons',
			'security/authorization messages',
			'messages generated internally by syslogd',
			'line printer subsystem',
			'network news subsystem',
			'UUCP subsystem',
			'clock daemon (note 2)',
			'security/authorization messages (note 1)',
			'FTP daemon',
			'NTP subsystem',
			'log audit (note 1)',
			'log alert (note 1)',
			'clock daemon (note 2)',
			'local use 0  (local0)',
			'local use 1  (local1)',
			'local use 2  (local2)',
			'local use 3  (local3)',
			'local use 4  (local4)',
			'local use 5  (local5)',
			'local use 6  (local6)',
			'local use 7  (local7)'
		] ;

		FACILITY.forEach((facility, code) => {
			assert.equal(Syslogd.facility(code), facility) ;
		}) ;
	}) ;
}) ;

