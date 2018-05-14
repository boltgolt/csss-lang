// Import the interpreter files
const preprocess = require("./interpreter/preprocessor.js")
const lexical = require("./interpreter/lexer.js")
const syntax = require("./interpreter/syntax.js")
const execute = require("./interpreter/executor.js")
const generate = require("./interpreter/generator.js")

module.exports = {
	/**
	 * Interpret a peice of code
	 * @param {String} input   The string to interpret
	 * @param {Object} options Object containing config options
	 */
	"run": (input, options) => {
		/**
		 * Get the current time in microseconds
		 * @return {Int} Timestamp
		 */
		function getTime() {
			// Get the time in nano seconds
			let hrTime = process.hrtime()
			// Get a rounded microsecond time
			return Math.round((hrTime[0] * 1000000 + hrTime[1]) / 10000)
		}

		return new Promise((resolve, reject) => {
			// The default config
			let config = {
				// Expose extra debug info
				"debug": false,
				// Filename of the script being run
				"filename": "inline",
				// Filesystem location of the script without the filename
				"location": "/",
				// The maximum number of files including each other in a loop
				"recursionLimit": 3,
				// Preset variables in the interpreter
				"variables": {}
			}

			// Go though every set config option to copy it
			if (typeof options == "object") {
				for (let option in options) {
					// Check that the option already has a default value
					if (option in config) {
						// Check that the type of the set option matches the default
						if (typeof config[option] === typeof options[option]) {
							// Set the config option
							config[option] = options[option]
						}
						// Reject it if it doesn't
						else {
							reject({
								type: "InvalidConfigOption",
								error: `Type "${typeof options[option]}" is invalid for "${option}" config option`
							})
						}
					}
					// If it doesn't it's not a valid option
					else {
						reject({
							type: "InvalidConfigOption",
							error: `Invalid config option "${option}"`
						})
					}
				}
			}

			// Save the reject function in the config
			config.reject = reject
			/**
			 * Abort execution and raise a critcal error
			 * @param  {String} type     A short name for the error thrown
			 * @param  {String} errorMsg The description of that went wrong
			 * @param  {Object} meta     An object with all debug info available
			 */
			config.crit = (type, errorMsg, meta) => {
				// Build the error object
				let errorObj = {
					type: type
				}

				// Add an error message if we have one
				if (typeof errorMsg == "string") errorObj.error = errorMsg
				// Do the same for the meta object
				if (typeof meta == "object") errorObj.meta = meta

				// Fail the promise
				reject(errorObj)
			}

			// Start an empty array for non-critical warnings
			config.warns = []
			/**
			 * Add a non-critical warning to the list
			 * @param  {String} warning The warning raised
			 * @param  {Object} meta    All possible info of the location of the warning
			 */
			config.warn = (warning, meta) => {
				config.warns.push({
					warning: warning,
					meta: meta
				})
			}

			// The stages to run through
			const stages = [preprocess, lexical, syntax, execute, generate]
			// The last returned output, is the script input at first
			let lastResult = input
			// Collection of timings
			let timings = []
			// The last time recorded
			let lastTime = getTime()

			// Go though each stage
			for (let stage of stages) {
				// Note the time before we start
				lastTime = getTime()
				// Start the active stage
				lastResult = stage(lastResult, config)
				// Push the time it took
				timings.push((getTime() - lastTime) / 100)
			}

			// Generate an object with the script output and more
			resolve({
				output: lastResult,
				warnings: config.warns,
				timings: timings,
				variables: config.variables
			})
		})
	}
}
