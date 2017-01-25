var express = require("express")
var fs = require("fs")
var app = express()

var parser = require("./parser.js")

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

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
