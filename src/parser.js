function parsePRI(raw) {
	// PRI means Priority, includes Facility and Severity
	// e.g. 00110111 =  facility: 00110, severity: 111
	// e.g. facility = 6, severity=7

	// To reverse
	// Grab last 3 bits
	var severity = parseInt(raw) % 8 ;
	// Shift last 3 bits to right (and throw away)
	var facility = parseInt(raw) >> 3 ;
	return [facility, severity] ;
}

function parser(msg, rinfo) {
	// https://tools.ietf.org/html/rfc5424
	// e.g. <PRI>timestamp hostname tag: info
	msg = msg + '' ;
	var tagIndex = msg.indexOf(': ') ;
	if (tagIndex == -1) {
		return {
			facility: undefined,
			severity: undefined,
			tag: undefined,
			timestamp: new Date(),
			hostname: undefined,
			address: rinfo.address,
			family: rinfo.family,
			port: rinfo.port,
			size: rinfo.size,
			msg: msg
		} ;
	}

	var format = msg.substr(0, tagIndex) ;
	var priIndex = format.indexOf('>') ;
	var pri = format.substr(1, priIndex - 1) ;
	pri = parsePRI(pri) ;
	var lastSpaceIndex = format.lastIndexOf(' ') ;
	var tag = format.substr(lastSpaceIndex + 1) ;
	var last2SpaceIndex = format.lastIndexOf(' ', lastSpaceIndex - 1) ; // hostname cannot contain ' '
	var hostname = format.substring(last2SpaceIndex + 1, lastSpaceIndex) ;
	// timestamp is complex because don't know if it has year
	var timestamp = format.substring(priIndex + 1, last2SpaceIndex) ;
	timestamp = new Date(timestamp) ;
	timestamp.setYear(new Date().getFullYear()) ; // fix year to now
	return {
		facility: pri[0]
		, severity: pri[1]
		, tag: tag
		, timestamp: timestamp
		, hostname: hostname
		, address: rinfo.address
		, family: rinfo.family
		, port: rinfo.port
		, size: rinfo.size
		, msg: msg.substr(tagIndex + 2)
	} ;
}

module.exports = parser ;