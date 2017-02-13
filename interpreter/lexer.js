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
		if (current + text[index + 1] == "/*") {
			while (current + text[index + 1] != "*/") {
				next()
			}

			// Skip to after the comment
			next(next())
		}

		// KEYWORD
		// All keywords start with an @ in CSSS
		else if (current == "@") {
			let keyword = ""

			while (/[a-zA-Z]/.test(next())) {
				keyword += current
			}

			pushToken("keyword", keyword)
		}

		// xPAR & xBRACE
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

		// SEMI
		else if (current == ";") {
			pushToken("semi", ";")
			next()
		}

		// VARIABLE
		// Just ignore the "var()" things, they're only here because of CSS
		else if (current + text[index + 1] + text[index + 2] == "var") {
			index += 3
		}
		// Capture the actual variable
		else if (current + text[index + 1] == "--") {
			let variable = current

			while (/\w|-/.test(next())) {
				variable += current
			}

			pushToken("variable", variable)
		}

		// COMPARATOR
		// Capture all 2-char comparators
		else if (comparators.indexOf(current + text[index + 1]) != -1) {
			pushToken("comparator", current + text[index + 1])
			next(next())
		}
		// And Capture the 1 char ones too
		else if (comparators.indexOf(current) != -1) {
			pushToken("comparator", current)
			next()
		}

		// ARITHMETIC
		else if (arithmetics.indexOf(current) != -1) {
			pushToken("arithmetic", current)
			next()
		}

		// ASSIGN
		else if (current == ":") {
			pushToken("assign", ":")
			next()
		}

		// STRING
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

		// FLOAT
		else if (/\d|\./.test(current)) {
			let float = ""

			while (/\d|\./.test(current)) {
				float += current
				next()
			}

			pushToken("float", float)
		}

		// IDENTIFIER & BOOL
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
			else {
				pushToken("identifier", identifier)
			}
		}

		// HEX as identifier
		else if (current == "#") {
			let hex = current

			while (/[a-fA-F0-9]/.test(next())) {
				hex += current
			}

			pushToken("identifier", hex)
		}

		// If it matches nothing else, and isn't a whitespace character, throw an error
		else if (current.charCodeAt(0) != 9 && current.charCodeAt(0) != 10 && current.charCodeAt(0) != 32) {
			log(`Lexer error: Invalid character "${current}" in ${filename} at line ${line}`, log.ERROR)
		}
	}

	// Return the generated tokens to be handled further
	return tokens
}
