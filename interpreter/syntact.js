module.exports = function(tokens, filename) {
	var ast = {
		type: "program",
		variables: [],
		children: []
	}

	var line = 1
	var index = 0
	// The current block we're in, gobal by default
	var token

	function next() {
		if (index >= tokens.length - 1) {
			return token = false
		}
		else {
			return token = tokens[++index]
		}
	}

	function walkThrough(parent, closeFunction) {
		next()
		while (walk(parent, closeFunction) !== true) {
			next()
		}
	}

	function walk(parent, closeFunction) {
		if (token == false) {
			return true
		}

		if (typeof closeFunction == "function") {
			// console.log(token.type);
			if (closeFunction()) {
				return true
			}
		}

		// Keep up with the line number
		if (token.type == "line") {
			line = token.value
		}

		else if (token.type == "keyword" && token.value == "if") {
			var newBlock = {
				type: "if",
				left: [],
				right: [],
				operation: "",
				children: []
			}

			if (next().type != "lpar") {
				parseError([
					`Syntax error: Missing opening "(" after if statement.`,
					`In ${filename} at line ${line}.`,
				])
			}

			walkThrough(newBlock.left, function() {
				return token.type == "comparator"
			})

			walkThrough(newBlock.right, function() {
				return token.type == "rpar"
			})

			parent.push(newBlock)
		}

		else if (token.type == "lpar") {
			var newBlock = {
				type: "par",
				children: []
			}

			walkThrough(newBlock.children, function() {
				return token.type == "rpar"
			})

			parent.push(newBlock)
		}
		else {
			next()
		}
	}

	walkThrough(ast.children, function() {
		return false
	})

	return ast
}
