/*
 * STEP 4: Executor
 * Runs through the syntax tree and executes every node so only the rendered elements and their properties remain
 */

module.exports = function(ast, filename) {
	// Contains all variables and their values
	let variables = {}
	// The generated output elements
	let dom = {
		"tag": "body",
		"styles": {},
		"attributes": {},
		"children": []
	}

	/**
	 * Pass an error to the top level in a nice fashion
	 * @param  {String} msg     Message describing what went wrong
	 * @param  {Object} metaObj Meta object to get debug data from when enabled
	 */
	function passError(msg, metaObj) {
		if (config.debug && metaObj) {
			throwError(msg, metaObj.path, metaObj.line, metaObj.column)
		}
		else {
			throwError(msg)
		}
	}

	// Let node actually execute the math part
	function executeArithmetic(l, arith, r) {
		switch (arith) {
			case "+": return l + r
			case "-": return l - r
			case "*": return l * r
			case "/": return l / r
		}
	}

	// Compair 2 values
	function executeComparison(l, comp, r) {
		switch (comp) {
			case "==": return l == r
			case "!=": return l != r
			case ">=": return l >= r
			case "<=": return l <= r
			case ">": return l > r
			case "<": return l < r
		}
	}

	// Compair 2 values
	function executeLogical(l, logic, r) {
		switch (comp) {

		}
	}

	/**
	 * Symplifiy childnodes to a string
	 * @param  {Array}  node The children array
	 * @return {String}      The resulting string
	 */
	function solveStyle(children) {
		// Prepare a string to hold the output string
		let outString = ""

		// Loop though every child node
		for (let child of children) {
			// Init an empty string for this specific node
			let childString = ""

			switch (child.type) {
				// Values and strings can be saved directly as a string
				case "string":
				case "value":
					childString = child.value
					break;

				// Add the unit to numbers
				case "number":
					// Do not add an unit to plain numbers
					if (child.unit == "plain") {
						childString = child.value.toString()
					}
					else {
						childString = child.value + child.unit
					}
					break;

				// Encode the colors as full RGB/other strings
				case "color":
					// Loop though every number node in the color and format it
					for (let number of child.children) {
						if (childString.length == 0) {
							childString = number.value
						}
						else {
							childString += ", " + number.value
						}
					}

					// Add the color type, and start/end tags
					childString = child.name + "(" + childString + ")"
					break;

				// Try to get the value of the variable from memory
				case "variable":
					if (typeof variables[child.name] == "object") {
						childString = solveStyle(variables[child.name])
					}
					else {
						passError(`Unset variable ${child.name}`)
					}
					break;

				// Should never be encountered
				case "bool":
					childString = child.value ? "1" : "0"
					print("Boolean to integer conversion in property", print.WARN)
					break;

				default:
					console.error("UNKNOWN SOLVE STYLE ", child)
			}

			// Add this trimmed string to the output
			outString += " " +  childString.trim()
		}

		// Return a full style string
		return outString.trim()
	}

	/**
	* Get the returned value from a block
	 * @param  {Object} block A block from the AST
	 * @return {Object}       The return value of the block
	 */
	function getReturnValue(fullBlock) {
		// Get the first token in the block
		block = fullBlock[0]

		// Go though the possible types to resolve
		switch (block.type) {
			// We have a bare variable
			case "variable":
				// Check if the variable has been set
				if (typeof variables[block.name] != "object") 	passError(`Unset variable ${block.name}`)
				// Check if the variable is usable (it can only contain 1 value)
				if (variables[block.name].length != 1)			passError(`Unresolvable variable ${block.name} with value "${solveStyle(variables[block.name])}"`)

				// Get the value node
				let cont = variables[block.name][0]

				// Match the node with a type for boolean conversion
				switch (cont.type) {
					// Pass real booleans directly
					case "bool":
						return cont.value
						break;
					// Only use the number 1 as truthy, without looking at the unit
					case "number":
						return cont.value == 1
						break;
					default:
				}

				break;
			case "comparator":
				console.log("sd");
				break;
			default:

		}
	}

	/**
	 * Run through an array of children
	 * @param  {Array}  array  The array of children
	 * @param  {Object} parent The parent in the DOM, not the AST
	 */
	function runThrough(array, parent) {
		array.forEach(function(block) {
			run(block, parent)
		})
	}

	/**
	 * Execute a node
	 * @param  {Object} block  The AST node we're running
	 * @param  {Object} parent The DOM node above us
	 */
	function run(block, parent) {
		/// IF
		if (block.type == "if") {
			console.log(block);
			let condition = getReturnValue(block.condition)

			if (condition) {
				runThrough(block.children)
			}

		}

		/// ELEMENT
		else if (block.type == "element") {
			// Create a empty new element with the right tag
			let newElement = {
				"tag": block.name,
				"styles": {},
				"attributes": {},
				"children": []
			}

			// Loop through all selectors given
			for (let selector of block.selectors) {
				// There can only be 1 id, so set it when encountered
				if (selector.type == "id") {
					newElement.attributes.id = selector.name
				}
				// If it's a class
				else if (selector.type == "class") {
					// Set the class attribute if there isn't one already
					if (!newElement.attributes.class) {
						newElement.attributes.class = selector.name
					}
					// Otherwise, append it with a space
					else {
						newElement.attributes.class += " " + selector.name
					}
				}
			}

			// Go though all children
			runThrough(block.children, newElement)

			// Add this element to the DOM
			parent.children.push(newElement)
		}

		/// PROPERTY
		else if (block.type == "property") {
			// Set the style of the parent with the computed style
			parent.styles[block.name] = solveStyle(block.children)
		}

		/// ASSIGNMENT
		else if (block.type == "assignment") {
			// Add the children of the variable to memory
			variables[block.name] = block.children
		}

		else {
			console.log(parent);
			console.log(block);
		}
	}

	// Start working through the tree
	runThrough(ast.children, dom)

	// Return the DOM
	return dom
}
