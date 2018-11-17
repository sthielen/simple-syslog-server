/* eslint-disable no-unused-vars,no-undef */
var dgram = require('dgram') ;
var assert = require('assert') ;
var mocha = require('mocha') ;
var Syslog = require('../src/') ;

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
			assert.equal(Syslog.severity(code), severity) ;
		}) ;
	}) ;
}) ;

describe('given facility codes', () => {
	it('returns the correct description', () => {

		var FACILITY = [
			'kern',
			'user',
			'mail',
			'daemon',
			'auth',
			'syslog',
			'lpr',
			'news',
			'uucp',
			'cron',
			'authpriv',
			'ftp',
			'ntp',
			'logaudit',
			'logalert',
			'clock',
			'local0',
			'local1',
			'local2',
			'local3',
			'local4',
			'local5',
			'local6',
			'local7',
		] ;

		FACILITY.forEach((facility, code) => {
			assert.equal(Syslog.facility(code), facility) ;
		}) ;
	}) ;
}) ;

