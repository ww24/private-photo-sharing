/**
 * Model
 *
 */

var mongoose = require("mongoose"),
    loader = require("../libs/loader"),
    config = require("../config.json");

var url = "mongodb://";

if (config.db.user && config.db.pass) {
  url += [config.db.user, config.db.pass].map(encodeURIComponent).join(":") + "@";
}

url += config.db.host + ":" + config.db.port + "/" + config.db.name;

// create MongoDB connection
mongoose.connect(url);

module.exports = loader(__dirname);
