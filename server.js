/**
 * Private Photo Sharing
 */

var express = require("express"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    csrf = require("csurf"),
    morgan = require("morgan"),
    MongoStore = require("connect-mongo")(session),
    flash = require("connect-flash"),
    hogan = require("hogan-express"),
    passport = require("passport"),
    path = require("path"),
    fs = require("fs"),
    routes = require("./routes"),
    config = require("config");

var app = express();

// express settings
app.set("port", process.env.PORT || config.server.port || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.engine("html", hogan);
app.locals.partials = {
  header: "partials/header",
  footer: "partials/footer",
  modal: "partials/modal"
};

// middleware
app.use(express.static(path.resolve(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(session({
  name: config.session.name,
  cookie: config.session.cookie,
  secret: config.session.secret,
  store: new MongoStore({
    db: config.db.name,
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.pass
  })
}));
app.use(flash());
app.use(csrf());
app.use(function (req, res, next) {
  res.locals._csrf = req.csrfToken();
  next();
});

// logger
if (app.get("env") === "development") {
  app.use(morgan());
}

// passport settings
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

// load routes
routes.call(app);

// catch 404
app.use(function(req, res) {
  console.error(404, req.url);
  res.send("Not Found", 404);
});

// catch csrf token error
app.use(function (err, req, res, next) {
  if (err.code !== "EBADCSRFTOKEN") {
    return next(err);
  }

  // handle CSRF token errors here
  res.status(403);
  res.send("session has expired or form tampered with");
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: err
    });
  });
} else {
  process.on("uncaughtException", function (err) {
    console.error(err);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  if (err.message === "account-unavailable") {
    return res.send("この Twitter アカウントでは利用できません。");
  }

  res.render("error", {
    message: err.message,
    error: null
  });
});

// start server (late start)
// mongodb とのコネクションが確立される前に起動すると問題がある為
setImmediate(function listen() {
  var server = app.listen(app.get("port"), function() {
    console.log("Express server listening on " + server.address());
  });
  server.on("error", function (err) {
    if (err.code === "EADDRINUSE") {
      console.log(err.code);
      // cleanup に成功したら再度 listen を呼ぶ
      cleanup() && listen();
    }
  });
});
// お片付け (unix domain socket の一時ファイル削除)
function cleanup() {
  var sock = app.get("port");
  // sock が数字 (ポート番号) であれば抜ける
  if (! isNaN(sock)) {
    return false;
  }
  // sock が存在したら削除
  if (fs.existsSync(sock)) {
    fs.unlinkSync(sock);
    return true;
  }
  return false;
}
process.on("SIGINT", cleanup);
