/*
 * STEP 1: Preprocessor
 * Scans and injects code before it is passed to the lexer
 */

const fs = require("fs")

module.exports = function(text, filename, location) {
	/**
	 * Search for @requires in the code and give them to the parser
	 * @param  {String} text     A sting with CSSS code
	 * @param  {String} location The path to the folder containing the file
	 * @param  {String} filename The name of the CSSS file
	 * @param  {Array}  stack    All previous files that have been included
	 * @return {String}          Returns the code with the inserted files
	 */
	function searchRequire(text, location, filename, stack) {
		// Contains the amount of times this file has been inserted before in this stack
		let recursionNo = 0

		// Loop through the whole stack
		stack.forEach(function(index) {
			// If the current stack item is the same as the one were searching through, we have recursion
			if (index == location + "/" + filename) {
				recursionNo++
			}
		})

		// If we have too much recursion
		if (recursionNo == config.get("recursionLimit")) {
			// TODO: Show all stack paths
			print("Too much @require recursion in " + filename + ".", print.ERROR)
		}

		// Add this file to the stack
		stack.push(location + "/" + filename)

		// Test if the file starts with a shebang
		if (text.substr(0, 2) == "#!") {
			// Remove the first line from the text
			text = text.substr(text.indexOf("\n"))
		}

		// Loop through all characters in the file
		for (let i = 0; i < text.length; i++) {
			// If we hit this start of a comment
			if (text[i] + text[i + 1] == "/*") {
				// Skip until we hit the end of the comment
				while (text[i] + text[i + 1] != "*/") {
					i++
				}
			}

			// If we encounter a statement
			if (text[i] == "@") {
				// If the statement is a require one
				if (text.substr(i + 1, 7) == "require") {
					// Set the start of the statement and prepare a var for the loop
					let start = i + 8
					let t = start

					// Loop though the whole statement until we hit the closing semicolon, save the end char location in var t
					for (; t < text.length; t++) {
						if (text[t] == ";") {
							break
						}
					}

					// If we have hit the and of the file while searching for the end of the include, stop
					if (t == text.length) {
						print("Malformed @require in " + filename + ".", print.ERROR)
					}

					// Give the parser the string in the requie and a clone of the stack
					let insertedText = parseRequire(text.substr(start, t - start), filename, location, stack.slice(0))

					// Insert the found code from the require into the code we already had
					text = text.slice(0, i) + insertedText + text.slice(t + 1)
				}
			}
		}

		// Return the entire code file
		return text
	}

	/**
	 * Parse the @require contents and load them from disk
	 * @param  {String} string   The code found within the require statement
	 * @param  {String} filename The name of the file the statement was found in
	 * @param  {String} location The location of the file the statement was found in
	 * @param  {Array}  stack    The stack so far
	 * @return {String}          The code requested by the require
	 */
	function parseRequire(string, filename, location, stack) {
		// Set the current parse index, character and filename output
		let index = 0
		let current = ""
		let foundFile = ""

		// Loop though all characters
		while (index < string.length) {
			current = string[++index]

			// Read until you find the opening char
			if (/["|']/.test(current)) {
				// Set the opening char as the one that needs to close the string too
				let closing = current

				// Skip to the next char
				current = string[++index]

				// Keep reading until we hid the closing char or end of file
				while (current != closing && index <= string.length) {
					// Add the newly found char to the filename
					foundFile += current

					// Go to the next char
					current = string[++index]
				}

				// TODO: Illegal chars warn

				// TODO: Non-CSSS file warn

				// Throw an error if we hit the end of the strin withou finding the closing tag
				if (index == string.length) {
					print("Malformed @require in " + filename + ".", print.ERROR)
				}

				// Stop searching for the string
				break
			}
		}

		// Get the full system path of the file
		let fullPath = location + "/" + foundFile
		let fileContents

		// Try to read the contents of the file
		try {
			fileContents = fs.readFileSync(fullPath)
		} catch (err) {
			// TODO: Permission erros
			print("The required file " + fullPath + " does not exist on disk.", print.ERROR)
		}

		// Strip the full path of the filename so only the location remains
		var returnLocation = fullPath.substr(0, fullPath.lastIndexOf("/"))
		// Substr the full path so only the new filename remains
		var returnFilename = fullPath.substr(fullPath.lastIndexOf("/") + 1, fullPath.length - fullPath.lastIndexOf("/"))
		// Search the found file for more requires and return the full result
		return searchRequire(fileContents.toString(), returnLocation, returnFilename, stack)
	}

	// Call the search function on the root file, stack is empty for root
	return searchRequire(text, location, filename, [])
}
