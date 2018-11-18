/* eslint-disable no-unused-vars,no-undef */
const dgram = require('dgram') ;
const assert = require('assert') ;
const mocha = require('mocha') ;
const SyslogServer = require('../src/') ;

describe('given severity codes', () => {
	it('returns the correct description', () => {

		const SEVERITY = [
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
			assert.equal(SyslogServer.severity(code), severity) ;
		}) ;
	}) ;
}) ;

describe('given facility codes', () => {
	it('returns the correct description', () => {

		const FACILITY = [
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
			assert.equal(SyslogServer.facility(code), facility) ;
		}) ;
	}) ;
}) ;

