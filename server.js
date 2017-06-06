// Required packages
const express = require("express")
const colors = require("colors/safe")
const fs = require("fs")

// Load the configuration file
global.config = require("config")

// Init express app
let app = express()

let logLevel = 3

/**
 * Send a message to the console
 * @param  {String} text The text to display
 * @param  {String} type One of the log types/levels, see below
 */
global.print = function(text, type) {
	// Do not allow logs without type
	if (typeof type != "string") {
		print(`Typeless log text: "${text}"`, print.DEBUG)
		print("Log call without a type, please fix.", print.ERROR)
	}

	// Get the current time and add a leading 0 when needed
	let d = new Date()
	let h = (d.getHours() < 10 ? "0" : "") + d.getHours()
	let m = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes()
	let s = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds()

	let tag = false

	// If the type is debug, check if we should log it, and return a nice colored tag if we do
	if (type == print.DEBUG) {
		if (logLevel < 3) {
			return
		}

		tag = colors.cyan("DEBG")
	}
	// Idem dito for the LOG log level
	else if (type == print.LOG) {
		if (logLevel < 2) {
			return
		}

		tag = "LOGN"
	}
	// Idem dito for the WARN log level
	else if (type == print.WARN) {
		if (logLevel < 1) {
			return
		}

		tag = colors.yellow("WARN")
	}
	// Errors will always be logged
	else {
		tag = colors.red("ERRR")
	}

	// Write it all to console
	process.stdout.write(`[${h}:${m}:${s}] [${tag}] ${text}\n`)
}

// The loglevel constants
global.print.ERROR = "error"
global.print.WARN = "warn"
global.print.LOG = "log"
global.print.DEBUG = "debug"

/**
 * Show a nice error in the console and quit
 * @param  {String} errorMsg A custom error message to let the user know what went wrong, can contain line breaks if needed
 * @param  {String} path     The path of the CSSS file in which the error occurred
 * @param  {Int}    line     The line on which it occurred
 * @param  {Int}    column   The aproximate column on which it occurred
 */
global.throwError = function(errorMsg, path, line, column) {
	// Print the error message with timestamp
	print("An unrecoverable error occurred", print.ERROR)

	// Will contain all lines in the file
	let fileLines = []
	// Will contain a human readable line string
	let formalLine
	// Will contain a human readable path string
	let formalPath

	// Try to read the files lines, or set to false when that fails
	try {
		fileLines = fs.readFileSync(path).toString().split("\n")
	} catch (e) {
		fileLines = false
	}

	// Give the line number if we have one
	if (!isNaN(line)) {
		formalLine = "line " + line
	}
	// Or let it be known that we have no clue
	else {
		formalLine = "an unknown line"
	}

	// Give the right path
	if (typeof path == "string") {
		formalPath = "in " + path
	}
	// Or point them in the right direction if we don't have one
	else {
		formalPath = "in a file"
	}

	// Format the newlines
	errorMsg = errorMsg.replace(/\n/g, "\n\t")

	// Print the passed error message
	process.stdout.write(colors.yellow(`
	${errorMsg}`))

	// If we're debugging, print the passed line and path
	if (config.debug) {
		process.stdout.write(colors.yellow(colors.italic(`
	At ${formalLine} ${formalPath}`)))
	}
	// If we aren't, print a hint to eneble it
	else {
		process.stdout.write(colors.green(colors.italic(`
	You might get more details if you enable the ${colors.white("debug")} config option`)))
	}

	// If we have the file lines
	if (fileLines !== false && !isNaN(line)) {
		// Generate the right padding more the error cursor indicator
		let padding = ""
		for (var i = 0; i < column - 1; i++) {
			padding += " "
		}

		// Get the right line from the file and replace the tabs with spaces
		let foundLine = fileLines[line - 1].replace(/\t/g, " ")

		// Print the line in which the error occurred
		process.stdout.write(colors.red(`

	${foundLine}`))

		// Print the padding and the cursor indicator
		process.stdout.write(colors.red(`
	${padding}`))
		process.stdout.write(colors.bold(colors.bgRed(colors.white("^"))))
	}

	// Add some extra whitespace
	process.stdout.write("\n\n")

	// Exit the program
	process.exit()
}

print("Starting CSSS-Server v" + require("./package.json").version, print.LOG)

const util = require('util')

let preprocessor = require("./interpreter/preprocessor.js")
let lexer = require("./interpreter/lexer.js")
let syntax = require("./interpreter/syntax.js")
// let execute = require("./interpreter/execute.js")

console.log(
	util.inspect((
			syntax(
				lexer(
					preprocessor(
						fs.readFileSync("./ex.csss").toString(),
						"ex.csss",
						process.cwd()
					)
				)
			)
		),
		{
			showHidden: false,
			depth: null,
			maxArrayLength: null,
			breakLength: 60
		}
	)
)
