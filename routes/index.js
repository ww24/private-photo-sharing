
var multer = require("multer"),
    path = require("path"),
    libs = require("../libs"),
    routes = libs.loader(__dirname),
    config = require("../config.json");

module.exports = function () {
  var app = this;

  app.use("/", routes.auth);
  
  app.use("/user", function (req, res, next) {
    if (! req.user || req.user.id !== config.admin.twitter) {
      return res.status(403).send("Forbidden");
    }
    next();
  });
  app.use("/user", routes.user);

  app.use("/photo", function (req, res, next) {
    if (! req.user) {
      return res.status(403).send("Forbidden");
    }
    next();
  });
  app.use("/photo", multer({dest: path.resolve(__dirname, "../temp")}));
  app.use("/photo", routes.photo);
};
