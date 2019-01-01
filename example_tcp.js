const Syslog = require('./src') ;

// Create our syslog server with the given transport
const options = {} ;
const address = '' ; // Any
const port = 20514 ;
const listen = {host: address, port: port} ;
var server = Syslog.TCP(options) ;

server.on('msg', data => {
	console.log('message received from %s:%i\n%o\n', data.address, data.port, data) ;
})
.listen(listen)
.then(() => {
	console.log(`Now listening on: ${address}:${port}`) ;
}) ;
