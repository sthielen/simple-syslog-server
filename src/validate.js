/**
 * validate.js
 *
 * Check Received Messages are Parsed Correctly
 *
 * simple-syslog-server
 *
 * 2018-12-30
 *
 * Copyright
 */

const valid = {
	'facility': 'string',
	'severity': 'string',
	'tag': 'string',
	'hostname': 'string'
} ;


function validate(msg) {
	let validated = true ;

	// Track which fields are invalid
	let invalid = [] ;

	Object.getOwnPropertyNames(valid).forEach(field => {
		// Is this field valid
		let v = (typeof msg[field] === valid[field]) ;
		// If not, then add to list of invalid fields
		// TODO Implement more meaningful error showing which fields are invalid
		if(!v)
			invalid.push(field);
		// Have we found an invalid field yet?
		validated = validated && v ;
	}) ;

	// Return false if any one field is invalid
	return validated ;
}

module.exports = validate ;
