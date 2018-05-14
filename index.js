// Import the interpreter files
const preprocessor = require("./interpreter/preprocessor.js")
const lexer = require("./interpreter/lexer.js")
const syntax = require("./interpreter/syntax.js")
const execute = require("./interpreter/executor.js")
const generate = require("./interpreter/generator.js")

module.exports = {
	"run": (input, options) => {
		/**
		 * Get the current time in microseconds
		 * @return {Int} Timestamp
		 */
		function getTime() {
			let hrTime = process.hrtime()
			return Math.round((hrTime[0] * 1000000 + hrTime[1]) / 10000)
		}



		return new Promise((resolve, reject) => {
			// The default config
			let config = {
				// Filename of the script being run
				"filename": "inline",
				// Filesystem location of the script without the filename
				"location": "/",
				// The maximum number of files including each other in a loop
				"recursionLimit": 3
			}

			if (typeof options == "object") {
				for (let option in options) {
					if (option in config) {
						config[option] = options[option]
					}
					else {
						reject(generateError("InvalidConfigOption", `Invalid config option "${option}"`, {}))
					}
				}
			}

			config.reject = reject
			config.crit = (type, errorMsg, meta) => {
				let errorObj = {
					type: type
				}

				if (typeof errorMsg == "string") {
					errorObj.error = errorMsg
				}

				if (typeof meta == "object") {
					errorObj.meta = meta
				}

				reject(errorObj)
			}

			config.warns = []
			config.warn = (warning, meta) => {
				config.warns.push({
					warning: warning,
					meta: meta
				})
			}

			// Run the preprocessor
			let lastResult = input
			let lastTime = getTime()

			preprocessor(input, config)
			console.log("Preprocessor done in " + colors.cyan.bold((getTime() - lastTime) / 100 + "ms"))

			// Run the lexer
			lastTime = getTime()
			lastResult = lexer(lastResult)
			console.log("Lexer done in " + colors.cyan.bold((getTime() - lastTime) / 100 + "ms"))

			// Run the syntaxer
			lastTime = getTime()
			lastResult = syntax(lastResult)
			console.log("Syntaxer done in " + colors.cyan.bold((getTime() - lastTime) / 100 + "ms"))

			// Run the executor
			lastTime = getTime()
			lastResult = execute(lastResult)
			console.log("Executor done in " + colors.cyan.bold((getTime() - lastTime) / 100 + "ms"))

			lastTime = getTime()
			lastResult = generate(lastResult)
			console.log("Generator done in " + colors.cyan.bold((getTime() - lastTime) / 100 + "ms"))
		})
	}
}
