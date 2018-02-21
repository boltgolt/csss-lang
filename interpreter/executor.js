/*
 * STEP 4: Executor
 * Runs through the syntax tree and executes every node so only the rendered elements and their properties remain
 */

module.exports = function(ast, filename) {
	// return ast

	// Contains all variables and their values
	let variables = {}
	// The generated output elements
	let dom = []

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
	* Get the returned value from a block
	 * @param  {Object} block A block from the AST
	 * @return {Object}       The return value of the block
	 */
	function getReturnValue(fullBlock) {		console.log(block);

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

	function runThrough(array) {
		array.forEach(function(block) {
			run(block)
		})
	}

	function run(block) {
		if (block.type == "if") {
			let condition = getReturnValue(block.condition)

			if (condition) {
				runThrough(block.children)
			}

			console.log(condition);
		}
		else {
			console.log(block);
		}
	}

	runThrough(ast.children)

	return dom
}
