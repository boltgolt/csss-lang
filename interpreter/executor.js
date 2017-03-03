/*
 * STEP 4: Executor
 * Runs through the syntax tree and executes every node so only the rendered elements and their properties remain
 */

module.exports = function(ast, filename) {
	// return ast

	// Contains all variables and their values
	let variables = {}
	// The generated output elements
	let out = []

	/**
	 * Solve a calc block
	 * @param  {Object} block A calc block from the AST
	 * @return {Object}       A number or string object as result from the calc
	 */
	function solveCalc(block) {
		function doOperration(arith, subject) {
			// Let node actually execute the math part
			function executeMath(l, arith, r) {
				switch (arith) {
					case "+": return l + r
					case "-": return l - r
					case "*": return l * r
					case "/": return l / r
				}
			}

			// If we're trying to add strings together
			if (baseValue.type == "string" || subject.type == "string") {
				// We can't do anything to strings except to add them together
				if (arith.value != "+") {
					log(`Can not execute calc using ${arith.value} with a string, found at line ${subject.line} in ${filename}`, log.ERROR)
				}
				// Non-string values will automatically be converted to strings by javascript, so we don't have to bother
				else {
					baseValue.value += subject.value
				}
			}
			// If we're doning math on 2 numbers
			else if (subject.type == "number" && baseValue.type == "number") {
				// If they're both the same unit, just execute
				if (baseValue.unit == subject.unit) {
					baseValue.value = executeMath(baseValue.value, arith.value, subject.value)
				}
				// If the subject is plain, we can just do the math on the base and keep the unit
				else if ((baseValue.unit != "plain" && subject.unit == "plain") && (arith.value == "*" || arith.value == "/")) {
					baseValue.value = executeMath(baseValue.value, arith.value, subject.value)
				}
				// If the base is plain, we copy the new unit from the subject and do the math
				else if ((baseValue.unit == "plain" && subject.unit != "plain") && (arith.value == "*" || arith.value == "/")) {
					baseValue.unit = subject.unit
					baseValue.value = executeMath(baseValue.value, arith.value, subject.value)
				}
				// If they both have a non-plain number, we can't do the math
				else {
					log(`Could not complete cross-unit calculation at line ${subject.line} in ${filename}`, log.ERROR)
				}
			}
			// We can't calculate anything else
			else {
				log(`Unknown token type while executing calc at line ${subject.line} in ${filename}`, log.ERROR)
			}
		}

		// Start with the first value in the array
		let baseValue = block.children[0]

		// Loop though the others from left to right, adding them to the base
		for (let i = 1; i < block.children.length; i += 2) {
			doOperration(block.children[i], block.children[i + 1])
		}

		// Return the base when done
		return baseValue
	}

	/**
	 * Get the returned value from a block
	 * @param  {Object} block Block to inspec
	 * @return {Object}       Resolved block
	 */
	function getReturnValue(block) {
		// If we find a par block, go a level deeper
		if (block[0].type == "par") {
			return getReturnValue(block[0].children)
		}
		// If we find a calc, solve it
		else if (block[0].type == "calc") {
			return solveCalc(block[0])
		}
		// Otherwise, there can only be 1 node, return it
		else {
			return block[0]
		}
	}

	function runThrough(array) {
		array.forEach(function(block) {
			run(block)
		})
	}

	function run(block) {
		if (block.type == "if") {
			function executeCompair(l, comp, r) {
				switch (comp) {
					case "==": return l == r
					case "!=": return l != r
					case ">=": return l >= r
					case "<=": return l <= r
					case ">": return l > r
					case "<": return l < r
				}
			}

			let left = getReturnValue(block.left)
			let right = getReturnValue(block.right)

			if (left.type == "string") {
				log(`Illegal string encountered in if on left hand site at line ${left.line} in ${filename}`, log.ERROR)
			}
			else if (right.type == "string") {
				log(`Illegal string encountered in if on right hand site at line ${right.line} in ${filename}`, log.ERROR)
			}
			else if (left.unit != right.unit) {
				log(`Can not compair 2 diffrent units in an if, like ${left.unit} and ${right.unit} as found at line ${left.line} in ${filename}`, log.ERROR)
			}

			let result = executeCompair(left.value, block.operation, right.value)

			process.exit()
		}
		console.log(block);
	}

	runThrough(ast.children)

	return out
}
