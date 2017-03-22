/*
 * STEP 2: Lexer
 * Turns a stream of characters into an array of tokens
 */

// All allowed comparative operators
const comparators = [
	"==",
	"!=",
	">=",
	"<=",
	">",
	"<"
]

// All allowed arithmetic operators
const arithmetics = [
	"+",
	"-",
	"*",
	"/"
]

// All allowed logical operators
const logics = [
	"&&",
	"||"
]

// All units recognised as CSS unit
const validUnits = [
	"%",
	"cm",
	"em",
	"ex",
	"in",
	"mm",
	"pc",
	"pt",
	"px",
	"vh",
	"vw",
	"vmin"
]

// The function call by the main server file
module.exports = function(text, filename) {
	/**
	 * Add a token to the token array
	 * @param  {String} type  The token type
	 * @param  {String} value The value found in the input
	 */
	function pushToken(type, value) {
		tokens.push({
			type: type,
			value: value
		})
	}

	/**
	 * Go to the next character
	 * @return {String} The new character, also accesible by reading current
	 */
	function next() {
		// If we've just passed a newline, increment the line number
		if (current == "\n") {
			line++
			pushToken("line", line)
		}

		return current = text[++index]
	}

	/**
	 * Look at characters in the text without changing the index
	 * @param  {Int}    start    The starting position relative to the current index, where 0 is the index
	 * @param  {Int}    distance Optional, the length of the string to return. For example, (0, 2) will return the current and next char
	 * @return {String}          The character(s) found
	 */
	function peek(start, distance) {
		// If we have the optional length
		if (typeof distance == "number") {
			// WIll de filled with the found chars
			var output = ""

			// Loop through the upcomming chars until we hit the max distance
			for (var i = 0; i < distance; i++) {
				// Add the found char to the output
				output += text[index + start + i]
			}

			return output
		}
		// If the length is not specified, we only return the next char
		else {
			return text[index + start]
		}
	}

	// Array containing all generated tokens
	let tokens = []
	// Current char index
	let index = 0
	// Current file line number
	let line = 1
	// The currently active char
	let current

	// Loop though the whole file
	while (index < text.length) {
		current = text[index]

		// Skip all whitespaces
		if (/[ |\t|\n]/.test(current)) {
			next()
		}

		// Skip all comments
		if (peek(0, 2) == "/*") {
			while (peek(0, 2) != "*/") {
				next()
			}

			// Skip to after the comment
			next(next())
		}

		/// KEYWORD
		// All keywords start with an @ in CSSS
		else if (current == "@") {
			let keyword = ""

			while (/[a-zA-Z]/.test(next())) {
				keyword += current
			}

			pushToken("keyword", keyword)
		}

		/// xPAR, xBRACE & xSBRACE
		else if (current == "(") {
			pushToken("lpar", "(")
			next()
		}
		else if (current == ")") {
			pushToken("rpar", ")")
			next()
		}
		else if (current == "{") {
			pushToken("lbrace", "{")
			next()
		}
		else if (current == "}") {
			pushToken("rbrace", "}")
			next()
		}
		else if (current == "[") {
			pushToken("lsbrace", "[")
			next()
		}
		else if (current == "]") {
			pushToken("rsbrace", "]")
			next()
		}

		/// SEMI
		else if (current == ";") {
			pushToken("semi", ";")
			next()
		}

		/// VARIABLE
		// Just ignore the "var()" things, they're only here because of CSS
		else if (peek(0, 3) == "var") {
			index += 3
		}
		// Capture the actual variable
		else if (peek(0, 2) == "--") {
			let variable = current

			while (/\w|-/.test(next())) {
				variable += current
			}

			pushToken("variable", variable)
		}

		/// FLOAT
		// Allow negetive floats but catch classes
		else if (/\d/.test(current) || (current == "-" && /\d|\./.test(peek(1))) || (current == "." && /\d/.test(peek(1)))) {
			let float = current
			next()

			while (/\d|\./.test(current)) {
				float += current
				next()
			}

			pushToken("float", parseFloat(float))
		}

		/// COMPARATOR
		// Capture all 2-char comparators
		else if (comparators.indexOf(peek(0, 2)) != -1) {
			pushToken("comparator", peek(0, 2))
			next(next())
		}
		// And Capture the 1 char ones too
		else if (comparators.indexOf(current) != -1) {
			pushToken("comparator", current)
			next()
		}

		/// ARITHMETIC
		else if (arithmetics.indexOf(current) != -1) {
			pushToken("arithmetic", current)
			next()
		}

		/// LOGIC
		else if (logics.indexOf(peek(0, 2)) != -1) {
			pushToken("logic", peek(0, 2))
			next(next())
		}
		// Inversions are special
		else if (current == "!") {
			pushToken("logic", "!")
			next()
		}

		/// ASSIGN
		else if (current == ":") {
			pushToken("assign", ":")
			next()
		}

		/// SEPARATOR
		else if (current == "," || current == "=") {
			pushToken("separator", current)
			next()
		}

		/// STRING
		// Anything starting with "
		else if (/["|']/.test(current)) {
			let string = ""
			let closing = current

			while (next() != closing) {
				string += current
			}

			pushToken("string", string)
			next()
		}

		/// CLASS
		// Anything starting with a dot followed by a letter
		else if (/\.[a-zA-Z]/.test(peek(0 , 2))) {
			let classname = ""
			// Skip the opening dot
			next()

			// Continue when we find letters, numbers or dashes
			while (/[\w-]/.test(current)) {
				classname += current
				next()
			}

			pushToken("class", classname)
			next()
		}

		/// IDENTIFIER, BOOL & UNIT
		else if (/[a-zA-Z%0-9-]/.test(current)) {
			// Can sometimes match undefined, skip those
			if (typeof current == "undefined") {
				continue
			}

			let identifier = current

			while (/[a-zA-Z%0-9-]/.test(next())) {
				identifier += current
			}

			lowIndentifier = identifier.toLowerCase()

			if (lowIndentifier == "true" || lowIndentifier == "false") {
				pushToken("bool", lowIndentifier)
			}
			else if (validUnits.indexOf(lowIndentifier) != -1) {
				pushToken("unit", lowIndentifier)
			}
			else {
				pushToken("identifier", identifier)
			}
		}

		/// HASH as identifier
		else if (current == "#") {
			let hash = ""

			while (/[\w-]/.test(next())) {
				hash += current
			}

			pushToken("hash", hash)
		}

		// If it matches nothing else, and isn't a whitespace character, throw an error
		else if (current.charCodeAt(0) != 9 && current.charCodeAt(0) != 10 && current.charCodeAt(0) != 32) {
			print(`Lexer error: Invalid character "${current}" in ${filename} at line ${line}`, print.ERROR)
		}
	}

	// Return the generated tokens to be handled further
	return tokens
}
