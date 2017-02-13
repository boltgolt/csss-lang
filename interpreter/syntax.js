module.exports = function(tokens, filename) {
	// Variable containing the whole program
	var ast = {
		type: "program",
		children: []
	}

	// Current line in the file
	var line = 1
	// Current index in the token stream
	var index = 0

	/**
	 * Skip to the next token in the stream
	 * @return {Obs} The new current token
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
	 * @param  {Obj}      parent        The parent object in the ast
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
	 * @param  {Obj}      parent        The parent object in the ast
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
				left: [],
				right: [],
				operation: "",
				children: []
			}

			// Check if the next node is a (, fail when it's not
			if (peek(function(token) {token.type != "lpar"})) {
				log(`Syntax error: Missing opening "(" after ${token.value} statement in ${filename} at line ${line}.`, log.ERROR)
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
				log(`Syntax error: Missing opening "{" after ${token.value} statement in ${filename} at line ${line}.`, log.ERROR)
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

		/// ELSE
		else if (token.type == "keyword" && token.value == "else") {
			// Create a new block
			var newBlock = {
				type: "else",
				children: []
			}

			// Check that the next node is a {
			if (peek(function(token) {token.type != "lbrace"; console.log(token);})) {
				log(`Syntax error: Missing opening "{" after else statement in ${filename} at line ${line}.`, log.ERROR)
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
				children: []
			}

			// Walk though it until we hit the end
			walkThrough(newBlock.children, function() {
				return token.type == "rpar"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		// Check if our parent gave us a closing function
		else if (typeof closeFunction == "function") {
			// If we match our parents closing function, hand the waling back to them
			if (closeFunction()) {
				return true
			}
		}
		// We don't know what to do with this
		else {
			next()
		}
	}

	// Walk though the entire node list
	walkThrough(ast.children, function() {
		return false
	})

	// Return the A.S.T.
	return ast
}
