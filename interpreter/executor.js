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
					childString = child.value + child.unit
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
				default:
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
		console.log(block);

		switch (block.type) {
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
			let condition = getReturnValue(block.condition)

			if (condition) {
				runThrough(block.children)
			}

			console.log(condition);
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

		else {
			console.log(parent);
			console.log(block);
		}
	}

	// Start wroking through the tree
	runThrough(ast.children, dom)

	// Return the DOM
	return dom
}
