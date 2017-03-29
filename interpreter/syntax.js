/*
 * STEP 3: Syntax scanner
 * Turns the tokens into a syntax tree, showing the parent-child relation between tokens
 */

// All allowed HTML tags
const validTags = require("./validTags.js")

module.exports = function(tokens, filename) {
	// Variable containing the entire program
	var ast = {
		type: "program",
		children: []
	}

	// Current index in the token stream
	let index = 0

	/**
	 * Skip to the next token in the stream
	 * @return {Object} The new current token
	 */
	function next() {
		if (index >= tokens.length - 1) {
			return false;
		}
		else {
			token = tokens[++index]

			// Keep up with the line number
			if (token.type == "line") {
				line = token.value
				return next()
			}

			return token
		}
	}

	/**
	 * Look at the next node in the stream without affecting the current token
	 * @param  {Function} callback Function to call that returns either true or false, with the peeked node as argument
	 * @param  {Int}      modifier The amount of nodes to skip, with 0 as the direct neighbour
	 * @return {Bool}              The return value of the callback
	 */
	function peek(callback, modifier) {
		if (!modifier) {
			modifier = 0
		}

		if (index >= tokens.length - 1) {
			return false
		}
		else {
			if (tokens[index + 1 + modifier].type == "line") {
				return peek(callback, modifier + 1)
			}

			return callback(tokens[index + 1 + modifier])
		}
	}

	/**
	 * Keep walking though nodes until closing function matches
	 * @param  {Object}   parent        The parent object in the ast
	 * @param  {Function} closeFunction Function that, when returning true, will hand the walking over to the caller
	 */
	function walkThrough(parent, closeFunction) {
		next()
		while (walk(parent, closeFunction) !== true) {
			next()
		}
	}

	/**
	 * Parse a the current token
	 * @param  {Object}   parent        The parent object in the ast
	 * @param  {Function} closeFunction Function that, when returning true, will hand the walking over to the parent
	 * @return {Bool}                   When true, will quit walking
	 */
	function walk(parent, closeFunction) {
		// If the token is bad or we've hit the end of the file, quit
		if (token == false || index >= tokens.length - 1) {
			return true
		}

		/// IF & WHILE
		else if (token.type == "keyword" && (token.value == "if" || token.value == "while")) {
			// Create a new block
			var newBlock = {
				type: token.value,
				line: line,
				left: [],
				right: [],
				operation: "",
				children: []
			}

			// Check if the next node is a (, fail when it's not
			if (peek(function(token) {token.type != "lpar"})) {
				log(`Syntax error: Missing opening "(" after ${token.value} statement in ${filename} at line ${line}`, log.ERROR)
			}
			next()

			// Get everything on the left by walking untill we hit the comparator
			walkThrough(newBlock.left, function() {
				return token.type == "comparator"
			})

			// Set the operation in the block
			newBlock.operation = token.value

			// Walk until we hit the end of the if argument
			walkThrough(newBlock.right, function() {
				return token.type == "rpar"
			})

			// Check that the next node is a {
			if (peek(function(token) {token.type != "lbrace"})) {
				log(`Syntax error: Missing opening "{" after ${token.value} statement in ${filename} at line ${line}`, log.ERROR)
			}
			next()

			// Now walk though the whole block until we hit our closing bracket
			walkThrough(newBlock.children, function() {
				return token.type == "rbrace"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// ELSE
		else if (token.type == "keyword" && token.value == "else") {
			// Create a new block
			var newBlock = {
				type: "else",
				line: line,
				children: []
			}

			// Check that the next node is a {
			if (peek(function(token) {token.type != "lbrace"})) {
				log(`Syntax error: Missing opening "{" after else statement in ${filename} at line ${line}`, log.ERROR)
			}
			next()

			// Now walk though the whole block until we hit our closing bracket
			walkThrough(newBlock.children, function() {
				return token.type == "rbrace"
			})
			next()

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// PAR
		else if (token.type == "lpar") {
			// Get a new par block
			var newBlock = {
				type: "par",
				line: line,
				children: []
			}

			// Walk though it until we hit the end
			walkThrough(newBlock.children, function() {
				return token.type == "rpar"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		// If we match our parents closing function, hand the waling back to them
		// Should be at this spot in the elifs because all opening chars are above it
		else if (closeFunction()) {
			return true
		}

		/// VARIABLE
		else if (token.type == "variable") {
			// If the variable is followed by an :, we're assigning
			if (peek(function(token) {return token.type == "assign"})) {
				// Create a new node
				newBlock = {
					type: "assignment",
					line: line,
					name: token.value,
					right: []
				}

				// Skip the colon
				next()

				// Walk though everything else until we encounter the semicolon
				walkThrough(newBlock.right, function() {
					return token.type == "semi"
				})

				// Push this block to our parent
				parent.push(newBlock)
			}
			else {
				// Push the mentioned variable to the parent
				parent.push({
					type: "variable",
					line: line,
					name: token.value
				})
			}
		}

		/// CALC
		else if (token.type == "identifier" && token.value == "calc") {
			// Create a new node
			var newBlock = {
				type: "calc",
				line: line,
				children: []
			}

			// Check that the next node is a (
			if (peek(function(token) {token.type != "lpar"})) {
				log(`Syntax error: Missing opening "{" after calc statement in ${filename} at line ${line}`, log.ERROR)
			}
			next()

			// Walk though everything else until we encounter the semicolon
			walkThrough(newBlock.children, function() {
				return token.type == "rpar"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// PROPERTY
		else if (token.type == "identifier" && peek(function(token) {return token.type == "assign"})) {
			// Create a new node
			var newBlock = {
				type: "property",
				line: line,
				name: token.value,
				children: []
			}

			// Skip the colon
			next()

			// Walk though everything else until we encounter the semicolon
			walkThrough(newBlock.children, function() {
				return token.type == "semi"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// ELEMENT
		else if (token.type == "identifier" && peek(function(token) {return token.type == "lbrace"})) {
			// Check if this is a valid HTML tag
			if (validTags.indexOf(token.value) == -1) {
				log(`The identifier ${token.value} (line ${line} in ${filename}) is not a valid HTML5 tag, but is parsed as one`, log.WARN)
			}

			// Create a new node
			var newBlock = {
				type: "element",
				line: line,
				name: token.value,
				children: []
			}

			// Skip the left bracket
			next()

			// Walk though everything else until we encounter the semicolon
			walkThrough(newBlock.children, function() {
				return token.type == "rbrace"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// VALUE
		// If the next thing is a semicolon, we have a css value
		else if (token.type == "identifier" && peek(function(token) {return token.type == "semi"})) {
			parent.push({
				type: "value",
				line: line,
				value: token.value
			})
		}

		/// ARITHMETIC
		else if (token.type == "arithmetic") {
			// Push the arithmetic operator to the parent
			parent.push({
				type: "arithmetic",
				line: line,
				value: token.value
			})
		}

		/// BOOL
		else if (token.type == "bool") {
			// Push the boolean to the parent
			parent.push({
				type: "bool",
				line: line,
				value: token.value == "true"
			})
		}

		/// STRING
		else if (token.type == "string") {
			// Push the string to the parent
			parent.push({
				type: "string",
				line: line,
				value: token.value
			})
		}

		/// NUMBER
		else if (token.type == "float") {
			// If the next node is an CSS unit
			if (peek(function(token) {return token.type == "identifier" && validUnits.indexOf(token.value) != -1})) {
				// Push to the parent with the right unit
				parent.push({
					type: "number",
					line: line,
					unit: peek(function(token) {return token.value}),
					value: parseFloat(token.value)
				})

				// Skip the identifier we just used as an unit
				next()
			}
			else {
				// Push the normal float to the parent
				parent.push({
					type: "number",
					line: line,
					unit: "plain",
					value: parseFloat(token.value)
				})
			}
		}

		// We don't know what to do with this
		else {
			log(`Unexpected ${token.type} ("${token.value}") found at line ${line} in ${filename}`, log.ERROR)
		}
	}

	// Walk though the entire node list
	walkThrough(ast.children, function() {
		return false
	})

	// Return the AST
	return ast
}
