var fs = require("fs")
var functions = require("./functions.js")

function parseVariable(vari) {
	var stringRegex = /["|'](.*?)["|']/.exec(vari)
	if (stringRegex) {
		return stringRegex[1]
	}

	if (!isNaN(parseFloat(vari))) {
		return parseFloat(vari)
	}

	if (vari == "true") {
		return true
	}
	else if (vari == "false") {
		return false
	}

	throw "Unknown variable " + vari
}

module.exports = {
	parse: function (path, callback) {
		var functionStack
		var outputText = ""

		function addFunctionToSack(name, line) {
			if (!functionStack) {
				functionStack = {
					name: name,
					line: line,
					attrs: {}
				}
			}
			else {
				var func = getDeepestFunction()
				func.child = {
					name: name,
					line: line,
					attrs: {}
				}
			}
		}

		function getDeepestFunction() {
			function lookDeeper(obj) {
				if (obj.child) {
					return lookDeeper(obj.child)
				}
				else {
					return obj
				}
			}

			if (!functionStack) {
				return functionStack
			}
			else {
				return lookDeeper(functionStack)
			}
		}

		fs.readFile("./web/" + path + ".csss", function(err, raw) {
			if (err) {
				// TODO: handle error
			}

			// Get a string from the buffer
			raw = raw.toString()
			// Remove all tabs and padding spaces
			raw = raw.replace(/\t|  |/g, "")

			// Split it up into lines
			var lines = raw.split("\n")

			// Loop through all lines
			for (var lineNum in lines) {
				var line = lines[lineNum]

				// If line is empry or a comment, skip
				if (line == "" || line.substring(0, 2) == "/*") {
					continue
				}

				// If the line is a function declaration
				if (/(\w*?) \{/g.exec(line)) {
					addFunctionToSack(/(\w*?) \{/g.exec(line)[1], lineNum + 1)
					console.log(functionStack);

					continue
				}

				var attrRegex = /(\w*?): (.*?);/.exec(line)
				// If the line is declareing a attribute
				if (attrRegex) {
					var func = getDeepestFunction()
					func.attrs[attrRegex[1]] = parseVariable(attrRegex[2])

					console.log("attr");
					console.log(func);
					console.log(functionStack);
				}

				if (line == "}") {
					var func = getDeepestFunction()

					outputText = functions[func.name](func.attrs, outputText)
				}
			}



			callback(outputText)
		})
	}
}
