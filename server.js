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

	// If it was an error, stop execution
	if (type == print.ERROR) {
		process.exit()
	}
}

// The loglevel constants
global.print.ERROR = "error"
global.print.WARN = "warn"
global.print.LOG = "log"
global.print.DEBUG = "debug"

print("Starting CSSS-Server v" + require("./package.json").version, print.LOG)

const util = require('util')

let preprocessor = require("./interpreter/preprocessor.js")
let lexer = require("./interpreter/lexer.js")
// let syntact = require("./interpreter/syntax.js")
// let execute = require("./interpreter/execute.js")

console.log(
	util.inspect((
			lexer(
				preprocessor(
					fs.readFileSync("./example.csss").toString(),
					"example.csss",
					process.cwd()
				),
				"example.csss"
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
