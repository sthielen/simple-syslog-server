# Simple-Syslog-Server

[![Simple Syslog Server](syslog-sml.png)](https://pixabay.com/photo-3685581/)


A simple evented syslog server and parser supporting UDP, TCP & TLS Transports

## Install

```sh
npm install simple-syslog-server
```

## Usage

```js
var Syslog = require('simple-syslog-server')
Syslog(function(info) {
  /*
  info = {
		facility: 'local6',
		facilityCode: 22,
		severity: 'debug',
		severityCode: 7,
		tag: 'tag',
		timestamp: Mon Dec 15 2014 10:58:44 GMT-0800 (PST),
		hostname: 'hostname',
		address: '127.0.0.1',
		family: 'IPv4',
		port: null,
		size: 39,
		msg: 'info'
  }
  */
}).listen(514, function(err) {
	if(err)
		throw err ;

  console.log('start')
})
```

Check parser performance by `npm run performance`, which will run 500000 times
