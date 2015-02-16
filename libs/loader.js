/**
 * Node.js module loader
 */

var fs = require("fs"),
    path = require("path");

module.exports = loader;

function loader(dirpath) {
  var libs = {};

  fs.readdirSync(dirpath).forEach(function (file) {
    var module = path.basename(file, ".js");
    var ext = path.extname(file);
    if (ext !== ".js") return;
    if (module === "index") return;

    libs[module] = require(path.join(dirpath, module));
  });

  return libs;
}
