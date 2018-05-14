/*
 * STEP 2: Lexer
 * Turns a stream of characters into an array of tokens
 */

/*
 * Possible token types:
 *
 * keyword      Any control flow statement, stripped of the @
 * variable     Variable name, without "--"
 * float        Number
 * comparator   A comparison operator
 * arithmetic   An arithmetic operator
 * logic        A logical operator
 * string       Just a normal string
 * bool         A boolean, as a boolean
 * unit         A CSS unit
 * identifier   All words that do not match any of the above
 * hash         Either a hex color value or an ID
 * element      A HTML element tag
 *
 * lpar         Opening parenthesis
 * rpar         Closing parenthesis
 * lcurb        Opening curly bracket
 * rcurb        Closing curly bracket
 * lsqarb       Opening square bracket
 * rsqarb       Closing square bracket
 * semi         Semicolon
 * inversion    The "not" operator ("!")
 * assign       Either a colon or an equals sign
 * separator    Comma
 *
 * All tokens have the full file path of the file they came from, and their line and column number
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
	"/",
	"%",
	"^"
]

// All units recognised as CSS unit
const validUnits = require("../data/units.js")

// All valid HTML tags
const validTags = require("../data/tags.js")

// The function call by the main server file
module.exports = function(text, config) {
	/**
	 * Add a token to the token array
	 * @param  {String} type  The token type
	 * @param  {String} value The value found in the input
	 */
	function pushToken(type, value) {
		let newToken = {
			type: type,
			value: value
		}

		if (config.debug) {
			newToken.meta = {
				path: currentFile.path,
				line: currentFile.line,
				column: currentFile.column
			}
		}

		tokens.push(newToken)
	}

	/**
	 * Go to the next character
	 * @return {String} The new character, also accesible by reading current
	 */
	function next() {
		// If we've just passed a newline update the file metea
		if (current == "\n") {
			// Increment the line number
			currentFile.line++
			// Reset the column for the new line, should be 0 as it is set to 1 on the next line
			currentFile.column = 0
		}

		// We've got the next character, increment the column
		currentFile.column++

		// Increment the current character
		current = text[++index]
		return current
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
			let output = ""

			// Loop through the upcomming chars until we hit the max distance
			for (let i = 0; i < distance; i++) {
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
	// The full paths of the files used as stack
	let filestack = []
	// The current top of the filestack
	let currentFile = {}
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
			// Check if it is a special CSSS tag
			if (peek(3, 9) == "CSSS:FILE") {
				// Skip the opening tag
				for (var i = 0; i < 13; i++) {
					next()
				}

				// If we have a path on our hands
				if (current == '"') {
					// Will contain the full filepath
					let path = ""

					// Skip the opening quote
					next()

					// Gather the path until we encounter a "
					while (next() != '"') {
						path += current
					}

					// Add the new file to the stack
					filestack.push({
						path: path,
						line: 1,
						column: 1
					})

					// Add the require length to the current column position
					currentFile.column += `@require "${path}"`.length
					// Set the newly added file as the current one
					currentFile = filestack[filestack.length - 1]

					// Skip the closing tag
					next(next(next(next())))
				}
				// If it's an closing tag, take the top of the stack
				else if (peek(0, 5) == "CLOSE") {
					// Only take the top of the stack if we haven't reached the root
					if (filestack.length > 1) {
						filestack.splice(-1, 1)
					}

					// Set the current active file
					currentFile = filestack[Math.max(filestack.length - 1, 0)]

					// Skip the CSS comment tail
					for (var t = 0; t < 8; t++) {
						next()
					}
				}
				// If it's neither, we have an invalid tag
				else {
					config.crit("InvalidCharacter", `Invalid CSSS comment tag found`, {
						path: currentFile.path,
						line: currentFile.line
					})
				}
			}
			// Otherwise, it's a comment
			else {
				while (peek(0, 2) != "*/") {
					next()
				}

				// Skip to after the comment
				next(next())
			}
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
			pushToken("lcurb", "{")
			next()
		}
		else if (current == "}") {
			pushToken("rcurb", "}")
			next()
		}
		else if (current == "[") {
			pushToken("lsqarb", "[")
			next()
		}
		else if (current == "]") {
			pushToken("rsqarb", "]")
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
		else if (peek(0, 2) == "&&" || peek(0, 2) == "||") {
			pushToken("logic", peek(0, 2))
			next(next())
		}

		/// INVERS
		else if (current == "!") {
			pushToken("inversion", "!")
			next()
		}

		/// ASSIGN
		else if (current == ":" || current == "=") {
			pushToken("assign", current)
			next()
		}

		/// SEPARATOR
		else if (current == ",") {
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
		}

		/// IDENTIFIER, BOOL, UNIT & ELEMENT
		else if (/[a-zA-Z%0-9-]/.test(current)) {
			// Can sometimes match undefined, skip those
			if (typeof current == "undefined") {
				continue;
			}

			let identifier = current

			while (/[a-zA-Z%0-9-]/.test(next())) {
				identifier += current
			}

			lowIndentifier = identifier.toLowerCase()

			if (lowIndentifier == "true" || lowIndentifier == "false") {
				// Pass the boolean as an actual boolean
				pushToken("bool", lowIndentifier == "true")
			}
			else if (validUnits.indexOf(lowIndentifier) != -1) {
				pushToken("unit", lowIndentifier)
			}
			else if (validTags.indexOf(lowIndentifier) != -1) {
				pushToken("element", lowIndentifier)
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
			config.crit("InvalidCharacter", `Invalid character "${current}"`, {
				path: currentFile.path,
				line: currentFile.line
			})
		}
	}

	// Return the generated tokens to be handled further
	return tokens
}
