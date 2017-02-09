var express = require("express")
var fs = require("fs")
var app = express()

var parser = require("./parser.js")

var logLevel = 3
var version = "0.0.0"

global.parseError = function (errorLines) {
    process.stdout.write("\x1b[41m\x1b[37m\x1b[1m                  CSSS PARSE ERROR                  \x1b[0m\n\n")

    for (var i = 0; i < errorLines.length; i++) {
        process.stdout.write(" " + errorLines[i] + "\n")
    }

    process.stdout.write("\n")
    process.exit()
}

global.log = function (text, type) {
    if (type == "warn") {
        if (logLevel < 1) {
            return
        }

        process.stdout.write("\x1b[33m")
    }
    else if (type == "log") {
        if (logLevel < 2) {
            return
        }
    }
    else if (type == "debug") {
        if (logLevel < 3) {
            return
        }

        process.stdout.write("\x1b[33m")
    }

    process.stdout.write("\x1b[0m\n")
}

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

console.log(lexer(`
@if(var(--my-dad) == "morris") {
	--his-age: 44;
}

--index: 8;

@while(var(--index) > 4) {
	--index: calc(var(--index) - 1);
	--his-age: calc(var(--his-age) + .1);
}

@if(var(--his-age) => 2.0) {
	send {
		content: "He's old";
	}
}
@else {
	send {
		content: calc('He is ' + var(--his-age));
	}
}

/* I'm a comment */
`, "filename.csss"))
