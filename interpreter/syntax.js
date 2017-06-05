/*
 * STEP 3: Syntax scanner
 * Turns the tokens into a syntax tree, showing the parent-child relation between tokens
 */

// All colors allowed with the same xx(x,x,x,x) format
const validColors = [
	"rgb",
	"rgba",
	"hsl",
	"hsla"
]

// Constant used to flag the closing function as non-blocking
const DONTBLOCK = "dontBlock"

module.exports = function(tokens) {
	// Variable containing the entire program
	let ast = {
		type: "program",
		children: []
	}

	// Current index in the token stream, negative to make up for incrementing to 0
	let index = -1

	/**
	 * Pass an error to the top level in a nice fashion
	 * @param  {String} msg   Message describing what went wrong
	 * @param  {Object} token Token objec to get debug data from when enabled
	 */
	function passError(msg, token) {
		if (config.debug) {
			throwError(msg, token.meta.path, token.meta.line, token.meta.column)
		}
		else {
			throwError(msg)
		}
	}

	/**
	 * Add metadata to a new token if needed
	 * @param  {Object} meta The meta object to add
	 * @param  {Object} obj  A newly created token
	 * @return {Object}      The modified token
	 */
	function genMeta(meta, obj) {
		// If the debug option is enabled, add the meta block
		if (config.debug) {
			obj.meta = meta
		}

		// Return the object
		return obj
	}

	/**
	 * Skip to the next token in the stream
	 * @return {Object} The new current token
	 */
	function next() {
		if (index >= tokens.length - 1) {
			return false
		} else {
			return tokens[++index]
		}
	}

	/**
	 * Reverse to the previous token in the stream
	 * @return {Object} The new current token
	 */
	function prev() {
		index -= 2
		return next()
	}

	/**
	 * Look at the next node in the stream without affecting the current token
	 * @param  {Function} callback Function to call that returns either true or false, with the peeked node as argument
	 * @param  {Int}	  modifier The amount of nodes to skip, with 0 as the direct neighbour
	 * @return {Bool}			  The return value of the callback
	 */
	function peek(callback, modifier) {
		if (!modifier) {
			modifier = 0
		}

		if (index >= tokens.length - 1) {
			return false
		} else {
			if (tokens[index + 1 + modifier].type == "line") {
				return peek(callback, modifier + 1)
			}

			return callback(tokens[index + 1 + modifier])
		}
	}

	/**
	 * Keep walking through nodes until closing function matches
	 * @param  {Object}   parent		The parent object in the ast
	 * @param  {Function} closeFunction Function that, when returning true, will hand the walking over to the caller
	 */
	function walkThrough(parent, closeFunction) {
		// No clue why, but this needs to be here due to some wierd scoping issue
		function overwriteParent(newObject) {
			hardParent = [newObject]
		}

		let hardParent = parent
		let lastResult = false
		next()

		while (lastResult !== true) {
			lastResult = walk(hardParent, closeFunction, overwriteParent)
			next()
		}

		return hardParent
	}

	/**
	 * Parse a the current token
	 * @param  {Object}   parent		The parent object in the ast
	 * @param  {Function} closeFunction Function that, when returning true, will hand the walking over to the parent
	 * @return {Bool}				   When true, will quit walking
	 */
	function walk(parent, closeFunction, overwriteParent) {
		let closeResult = false
		token = tokens[index]

		// If the token is bad or we've hit the end of the file, quit
		if (token == false || index >= tokens.length - 1) {
			return true
		}

		/// IF & WHILE
		else if (token.type == "keyword" && (token.value == "if" || token.value == "elif" || token.value == "while")) {
			let newBlock = genMeta(token.meta, {
				type: token.value,
				condition: [],
				children: []
			})

			// Check if the next node is a (, fail when it's not
			if (peek(function(token) {
					return token.type != "lpar"
				})) {
				passError(`Missing opening "(" after ${token.value} statement`, token)
			}
			next()

			// Walk until we hit the end of the if argument
			newBlock.condition = walkThrough(newBlock.condition, function(token) {
				return token.type == "rpar"
			})

			// Check that the next node is a {
			if (peek(function(token) {
					token.type != "lcurb"
				})) {
				passError(`Missing opening "{" after ${newBlock.value} statement`, token)
			}
			next()

			// Now walk through the whole block until we hit our closing bracket
			newBlock.children = walkThrough(newBlock.children, function() {
				return token.type == "rcurb"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// ELSE
		else if (token.type == "keyword" && token.value == "else") {
			// Create a new block
			let newBlock = genMeta(token.meta, {
				type: "else",
				children: []
			})

			// Check that the next node is a {
			if (peek(function(token) {
					token.type != "lcurb"
				})) {
				passError(`Missing opening "{" after else statement`, token)
			}
			next()

			// Now walk through the whole block until we hit our closing bracket
			walkThrough(newBlock.children, function() {
				return token.type == "rcurb"
			})
			next()

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// PAR
		else if (token.type == "lpar") {
			// Get a new par block
			let newBlock = genMeta(token.meta, {
				type: "par",
				children: []
			})

			// Walk through it until we hit the end
			walkThrough(newBlock.children, function() {
				return token.type == "rpar"
			})

			// Back up 1 token to let the parent catch the next exit
			prev()

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// ARRAY
		else if (token.type == "lsqarb") {
			// Create a new block
			let newBlock = genMeta(token.meta, {
				type: "array",
				children: []
			})

			// Loop until we find the closing tag
			let notClosed = true
			while (notClosed) {
				// Create a new array for all children at this array index
				let arrayElement = []

				// Run through the array index until we either find a separator or a closing bracket
				walkThrough(arrayElement, function() {
					if (token.type == "separator") {
						return DONTBLOCK
					}
					else if (token.type == "rsqarb") {
						return true
					}
				})

				// Stop looping when we find the end of the array
				if (token.type == "rsqarb") {
					notClosed = false
				}

				// Add the last walked array index to the array
				newBlock.children.push(arrayElement)
			}

			// Push this block to our parent
			parent.push(newBlock)
		}

		// If we match our parents closing function, hand the waling back to them
		// Should be at this spot in the elifs because all opening chars are above it
		else if (closeResult = closeFunction(token)) {
			if (closeResult !== DONTBLOCK) {
				return closeResult
			}
		}

		/// LOGIC
		else if (token.type == "logic") {
			// Check if we've had some tokens already, we cant compair things if we didn't
			if (parent.length == 0) {
				passError(`Empty left hand for logical operator "${token.value}"`, token)
			}

			// Create a new block with all previous tokens to the left
			let newBlock = genMeta(token.meta, {
				type: "logic",
				value: token.value,
				left: parent,
				right: []
			})

			// Go through the others and put them on the right
			newBlock.right = walkThrough(newBlock.right, function() {
				if (closeFunction(token)) {
					return true
				}

				return (token.type == "logic") ? DONTBLOCK : false
			})

			// If the right is empty, we can't compare the 2
			if (newBlock.right == 0) {
				passError(`Empty right hand for logical operator "${newBlock.value}"`, token)
			}

			// Set ourselfs as the only child
			overwriteParent(newBlock)

			// Complete the closing function
			return true
		}

		/// COMPARATOR
		else if (token.type == "comparator") {
			// Check if we've had some tokens already, we cant compair things if we didn't
			if (parent.length == 0) {
				passError(`Empty left hand for comparator "${token.value}"`, token)
			}

			// Create a new block with all previous tokens to the left
			let newBlock = genMeta(token.meta, {
				type: "comparator",
				value: token.value,
				left: parent,
				right: []
			})

			// Go through the others and put them on the right
			newBlock.right = walkThrough(newBlock.right, function() {
				if (closeFunction(token)) {
					return true
				}

				return (token.type == "logic") ? DONTBLOCK : false
			})

			// If the right is empty, we can't compare the 2
			if (newBlock.right == 0) {
				passError(`Empty right hand for comparator "${newBlock.value}"`, token)
			}

			// Set ourselfs as the only child
			overwriteParent(newBlock)

			// Complete the closing function
			return true
		}


		/// VARIABLE
		else if (token.type == "variable") {
			// Contains the index as a token, or false when there isn't an index
			let index = false
			// Contains the name of the variable which is lost when we start parsing the index
			let originalName = ""

			// If we have a square bracket directly after the variable, we have an array index
			if (peek(function(token) {
					return token.type == "lsqarb"
				})) {
				// Init the variables
				index = []
				originalName = token.value

				// Skipt the opening bracket
				next()

				// Walk through all tokens until we hit the closing bracket
				walkThrough(index, function() {
					return token.type == "rsqarb"
				})

				// If we have nothing, the array index was empty
				if (index.length == 0) {
					passError(`Empty array index found`, token)
				}
				// If we have one block, we have a valid index
				else if (index.length == 1) {
					index = index[0]
				}
				// If we have more than 1 block, we have an invalid index
				else {
					passError(`Invalid array index`, token)
				}
			}

			// If the variable is followed by an :, we're assigning
			if (peek(function(token) {
					return token.type == "assign"
				})) {
				// Create a new node
				let newBlock = genMeta(token.meta, {
					type: "assignment",
					name: token.value,
					children: []
				})

				// Add index if needed
				if (index !== false) {
					newBlock.index = index
					newBlock.name = originalName
				}

				// Skip the colon
				next()

				// Walk through everything else until we encounter the semicolon
				walkThrough(newBlock.children, function() {
					return token.type == "semi"
				})

				// Push this block to our parent
				parent.push(newBlock)
			} else {
				// Create a new block so we can attach the index if needed
				let newBlock = genMeta(token.meta, {
					type: "variable",
					name: token.value
				})

				// Add index if needed
				if (index !== false) {
					newBlock.index = index
					newBlock.name = originalName
				}

				// Push the mentioned variable to the parent
				parent.push(newBlock)
			}
		}

		/// CALC
		else if (token.type == "identifier" && token.value == "calc") {
			// Create a new node
			let newBlock = genMeta(token.meta, {
				type: "calc",
				children: []
			})

			// Check that the next node is a (
			if (peek(function(token) {
					token.type != "lpar"
				})) {
				passError(`Missing opening "(" after calc statement`, token)
			}
			next()

			// Walk through everything else until we encounter the closing parenthesis
			walkThrough(newBlock.children, function() {
				return token.type == "rpar"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// INVERSION
		else if (token.type == "inversion") {
			// Create a new node
			let newBlock = genMeta(token.meta, {
				type: "inversion",
				children: []
			})

			next()

			// Walk for only 1 token so we get only that block
			walk(newBlock.children, function() {
				return false
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// ELEMENT
		else if (token.type == "element") {
			// Create a new node
			let newBlock = genMeta(token.meta, {
				type: "element",
				name: token.value,
				children: [],
				selectors: []
			})

			// Keep looping while we haven't seen the opening bracked
			let notOpened = true
			while (notOpened) {
				// Get the next token
				let nextToken = {}
				peek(function(token) {
					nextToken = token
				})

				switch (nextToken.type) {
					// If it's a hash, add it as an ID
					case "hash":
						newBlock.selectors.push(genMeta(nextToken.meta, {
							type: "id",
							name: nextToken.value
						}))
						next()
						break;

						// Add the class
					case "class":
						newBlock.selectors.push(genMeta(nextToken.meta, {
							type: "class",
							name: nextToken.value
						}))
						next()
						break;

						// If it's in brackets, it should be an attribute
					case "lsqarb":
						// Create a new selector
						let newSelector = genMeta(nextToken.meta, {
							type: "attribute",
							// Skip the previous tag and the opening bracket to get the name
							name: next(next()).value,
							children: [],
						})

						// Check that it is followed by an assign
						if (peek(function(token) {
								return token.type != "assign"
							})) {
							passError(`Malformed attribute selector in element selector`, token)
						}

						// Skip the assign
						next()

						// Go through all tokens until we hit the closing bracket
						walkThrough(newSelector.children, function() {
							return token.type == "rsqarb"
						})

						// Add the selector to the block
						newBlock.selectors.push(newSelector)
						break;

						// Stop the loop when we have the elements opening bracket
					case "lcurb":
						notOpened = false
						next()
						break;

						// If it's neither of those, throw an error
					default:
						passError(`Unexpected ${nextToken.type} in element selector`, token)
				}
			}

			// Walk through everything else until we encounter the closing bracket
			walkThrough(newBlock.children, function() {
				return token.type == "rcurb"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// PROPERTY
		else if (token.type == "identifier" && peek(function(token) {
				return token.type == "assign"
			})) {
			// Create a new node
			let newBlock = genMeta(token.meta, {
				type: "property",
				name: token.value,
				children: []
			})

			// Skip the colon
			next()

			// Walk through everything else until we encounter the semicolon
			walkThrough(newBlock.children, function() {
				return token.type == "semi"
			})

			// Push this block to our parent
			parent.push(newBlock)
		}

		/// VALUE
		// If the next thing is a semicolon, we have a css value
		else if (token.type == "identifier" && peek(function(token) {
				return token.type == "semi"
			})) {
			parent.push(genMeta(token.meta, {
				type: "value",
				value: token.value
			}))
		}

		/// COLOR
		else if (token.type == "hash") {
			/**
			 * Add a number wrapper to a rgb color
			 * @param  {Int}    num The hex number
			 * @return {Object}     A newly created number object
			 */
			function wrapColor(num) {
				return genMeta(token.meta, {
					type: "number",
					unit: "plain",
					value: parseInt(num, 16)
				})
			}

			// Test if the string only contains hexadecimal characters
			if (!/^[0-9A-Fa-f]*$/.test(token.value)) {
				passError(`HEX color contains non-hex characters`, token)
			}

			// Create an array to contain the color codes and a value shorthand
			let hexes = []
			let v = token.value

			// If we have a short hex, diplicate every letter before adding them
			if (token.value.length == 3) {
				hexes = [v[0] + v[0], v[1] + v[1], v[2] + v[2]]
			}
			// If we have a full length, add the cars in pairs of 2
			else if (token.value.length == 6) {
				hexes = [v[0] + v[1], v[2] + v[3], v[4] + v[5]]
			}
			// Otherwise, we have an invalid length
			else {
				passError(`Invalid HEX color length`, token)
			}

			// Add the new color as RGB by parsing the hexes as decimals
			parent.push(genMeta(token.meta, {
				type: "color",
				name: "rgb",
				children: [
					wrapColor(hexes[0]),
					wrapColor(hexes[1]),
					wrapColor(hexes[2])
				]
			}))
		} else if (token.type == "identifier" && validColors.indexOf(token.value) != -1) {
			// Create a new color block
			let newBlock = genMeta(token.meta, {
				type: "color",
				name: token.value,
				children: []
			})

			// Check if we have an opening parenthesis
			if (peek(function(token) {
					return token.type != "lpar"
				})) {
				passError(`Missing opening parenthesis after color declaration`, token)
			}

			// Skip the parenthesis
			next()

			// Keep looping until we have the closing parenthesis
			let notClosed = true
			while (notClosed) {
				// Create a new array for all color values
				let colorElement = []

				// Run through the part of the color code until we either get to the start of the next or the end
				walkThrough(colorElement, function() {
					if (token.type == "separator") {
						return DONTBLOCK
					}
					else if (token.type == "rpar") {
						return true
					}
				})

				// Stop looping when we find the end of the color
				if (token.type == "rpar") {
					notClosed = false
				}

				// Add the newly found color code to the main array
				newBlock.children.push(colorElement)
			}

			// Push it to the parrent
			parent.push(newBlock)
		}

		/// ARITHMETIC
		else if (token.type == "arithmetic") {
			// Push the arithmetic operator to the parent
			parent.push(genMeta(token.meta, {
				type: "arithmetic",
				value: token.value
			}))
		}

		/// BOOL
		else if (token.type == "bool") {
			// Push the boolean to the parent
			parent.push(genMeta(token.meta, {
				type: "bool",
				value: token.value == "true"
			}))
		}

		/// STRING
		else if (token.type == "string") {
			// Push the string to the parent
			parent.push(genMeta(token.meta, {
				type: "string",
				value: token.value
			}))
		}

		/// NUMBER
		else if (token.type == "float") {
			// If the next node is an CSS unit
			if (peek(function(token) {
					return token.type == "unit"
				})) {
				// Push to the parent with the right unit
				parent.push(genMeta(token.meta, {
					type: "number",
					unit: peek(function(token) {
						return token.value
					}),
					value: parseFloat(token.value)
				}))

				// Skip the identifier we just used as an unit
				next()
			} else {
				// Push the normal float to the parent
				parent.push(genMeta(token.meta, {
					type: "number",
					unit: "plain",
					value: parseFloat(token.value)
				}))
			}
		}

		// We don't know what to do with this
		else {
			passError(`Unexpected ${token.type} ("${token.value}") encountered`, token)
		}
	}

	// Walk through the entire node list
	walkThrough(ast.children, function() {
		return false
	})

	console.log("\n\n");

	// Return the AST
	return ast
}
