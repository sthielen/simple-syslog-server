
const FRAME_TYPE_UNKNOWN = 0 ;
const FRAME_TYPE_NEWLINE = 1 ;
const FRAME_TYPE_OCTET = 2 ;

function FrameParser(callback) {
	this.buffer = Buffer.from('') ;
	this.callback = callback ;
	this.frame_state = FRAME_TYPE_UNKNOWN ;
}

FrameParser.prototype.feed = function(data) {
	this.buffer = Buffer.concat([this.buffer, data]) ;
	this.check_framing() ;
} ;

FrameParser.prototype.done = function() {
	if (this.buffer.length > 0)
		this.callback(this.buffer.toString()) ;

	this.buffer = Buffer.from('', 'UTF-8') ;
} ;

FrameParser.prototype.check_framing = function() {
	let continue_digesting ;
	do {
		if (this.frame_state == FRAME_TYPE_UNKNOWN)
			continue_digesting = this.decide_on_frame_type() ;
		else if (this.frame_state == FRAME_TYPE_NEWLINE)
			continue_digesting = this.check_newline_framing() ;
		else if (this.frame_state == FRAME_TYPE_OCTET)
			continue_digesting = this.check_octet_frame() ;
		else
			throw 'Invalid frame state' ;

	} while (continue_digesting);
} ;

FrameParser.prototype.decide_on_frame_type = function() {
	// do nothing if buffer is too short
	if (this.buffer.length < 8)
		return false ;

	// shrink our check buffer
	let check = this.buffer.slice(0, 8) ;
	// Do we have spaces?
	let space = check.indexOf(' ') ;
	if (space == -1) {
		this.frame_state = FRAME_TYPE_NEWLINE ;
		return true ;
	}

	// Check output if we can convert it to a number
	let size = parseInt(check.slice(0, space), 10) ;
	if (isNaN(size) || size < 2) {
		this.frame_state = FRAME_TYPE_NEWLINE ;
		return true ;
	}

	// Octet framing
	this.octets = size ;
	this.frame_state = FRAME_TYPE_OCTET ;
	this.buffer = this.buffer.slice(space + 1) ;
	return true ;
} ;

FrameParser.prototype.check_newline_framing = function() {
	let indexOfNewLine = this.buffer.indexOf('\n') ;
	if (indexOfNewLine == -1) return false ;

	const frame = this.buffer.slice(0, indexOfNewLine) ;
	this.buffer = this.buffer.slice(indexOfNewLine + 1) ;

	return this._emit_and_reset(frame) ;
} ;

FrameParser.prototype.check_octet_frame = function() {
	let size = this.octets ;
	if (!size) throw 'Not currently in octet strategy' ;

	if (this.buffer.length < size) return false ;

	let frame = this.buffer.slice(0, size) ;
	this.buffer = this.buffer.slice(size) ;

	return this._emit_and_reset(frame) ;
} ;

FrameParser.prototype._emit_and_reset = function(frame) {
	this.callback(frame.toString('utf-8')) ;

	this.frame_state = FRAME_TYPE_UNKNOWN ;
	return true ;
} ;

module.exports = FrameParser ;
