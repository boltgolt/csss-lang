// Required packages
var express = require("express")
var colors = require("colors/safe")
var fs = require("fs")

// Temp includes
const util = require('util')

// Init express app
var app = express()

var logLevel = 3

/**
 * Send a message to the console
 * @param  {String} text The text to display
 * @param  {String} type One of the log types/levels, see below
 */
global.log = function(text, type) {
    // Do not allow logs without type
    if (typeof type != "string") {
        log(`Typeless log text: "${text}"`, log.DEBUG)
        log("Log call without a type, please fix.", log.ERROR)
    }

    // Get the current time and add a leading 0 when needed
    var d = new Date()
    var h = (d.getHours() < 10 ? "0" : "") + d.getHours()
    var m = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes()
    var s = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds()

    var tag = false

    // If the type is debug, check if we should log it, and return a nice colored tag if we do
    if (type == log.DEBUG) {
        if (logLevel < 3) {
            return
        }

        tag = colors.cyan("DEBG")
    }
    // Idem dito for the LOG log level
    else if (type == log.LOG) {
        if (logLevel < 2) {
            return
        }

        tag = "LOGN"
    }
    // Idem dito for the WARN log level
    else if (type == log.WARN) {
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
    if (type == log.ERROR) {
        process.exit()
    }
}

// The loglevel constants
global.log.ERROR = "error"
global.log.WARN = "warn"
global.log.LOG = "log"
global.log.DEBUG = "debug"

log("Starting CSSS-Server v" + require("./package.json").version, log.LOG)

fs.readdir("web", function(err, files) {
    for (var i = 0; i < files.length; i++) {
        if (files[i].indexOf(".csss") == files[i].length - 5) {
            function addToExpress(path, file) {
                app.get(path, function (req, res) {
                    parser.parse(file, function(resp) {
                        res.set("Server", "CSSSS (Cascading Style Sheets Script Server)")
                        res.set("Content-Type", "text/plain")
                        res.send(resp)
                    })
                })
            }

            var name = files[i].substr(0, files[i].length - 5)

            addToExpress("/" + name + ".csss", name)

            if (name == "index") {
                addToExpress("/", name)
            }
        }
    }
})

app.disable("x-powered-by")

// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!')
// })
//
//

var lexer = require("./interpreter/lexer.js")
var syntact = require("./interpreter/syntax.js")
var execute = require("./interpreter/execute.js")

console.log(util.inspect(
    execute(
        syntact(
            lexer(`
    @if ((calc(2 * 2px / 2)) == 3px) {
    	--his-age: 44;
    }

    --index: 8;

    @while(var(--index) > 4) {
    	--index: calc(var(--index) - 1);
    	--his-age: calc(var(--his-age) + .1);
    }

    @if(var(--his-age) > 2.0) {
        h7 {
    		content: "He's old";
    	}
    }
    @else {
        h1 {
    		content: calc('He is ' + var(--his-age));

            color: #fff;
            font-size: calc(20px + 30vh);

            @if(true == true) {
                text-align: center;
            }
        }
    }

    /* I'm a comment */
    `,
            "filename.csss"),
        "filename.csss"),
    "filename.csss"),
{showHidden: false, depth: null, maxArrayLength: null, breakLength: 60}))
