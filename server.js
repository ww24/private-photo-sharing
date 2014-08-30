/**
 * Private Photo Sharing
 */

var express = require("express"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    MongoStore = require("connect-mongo")(session),
    flash = require("connect-flash"),
    hogan = require("hogan-express"),
    passport = require("passport"),
    path = require("path"),
    routes = require("./routes"),
    config = require("./config.json");

var app = express();

// express settings
app.set("port", process.env.PORT || config.server.port || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.engine("html", hogan);
app.locals.partials = {
  header: "partials/header",
  footer: "partials/footer"
};

// middleware
app.use(express.static(path.resolve(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(session({
  store: new MongoStore({
    db: config.db.name,
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.pass
  }),
  secret: config.session.secret
}));
app.use(flash());

// passport settings
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

// load routes
routes.call(app);

/// catch 404
app.use(function(req, res) {
  console.error(404, req.url);
  res.send("Not Found", 404);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
  res.status(err.status || 500);

  if (err.message === "account-unavailable") {
    return res.send("この Twitter アカウントでは利用できません。");
  }

  res.render("error", {
    message: err.message,
    error: null
  });
});

process.on("uncaughtException", function (err) {
  console.error(err);
});

// start server
var server = app.listen(app.get("port"), function() {
  console.log("Express server listening on port " + server.address().port);
});
