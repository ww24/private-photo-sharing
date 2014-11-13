/**
 * Index Router
 *
 */

var express = require("express"),
    router = express.Router(),
    libs = require("../libs"),
    routes = libs.loader(__dirname),
    config = require("config");

// トップページ
router.get("/", function (req, res) {
  res.locals.template = "index";
  res.locals.title = "";
  res.render(res.locals.template);
});
router.use("/", routes.auth);

// ログイン後トップページ
router.use("/home", function (req, res, next) {
  if (! req.user) {
    return res.redirect(302, "/auth");
  }
  next();
});
router.use("/home", routes.home);

// ユーザ管理画面
router.use("/user", function (req, res, next) {
  if (! req.user || req.user.id !== config.admin.twitter) {
    return res.status(403).send("Forbidden");
  }
  next();
});
router.use("/user", routes.user);

// photo API (internal)
router.use("/photo", function (req, res, next) {
  if (! req.user) {
    return res.status(403).send("Forbidden");
  }
  next();
});
router.use("/photo", routes.photo);

// catch 404
router.use(function(req, res) {
  console.error(404, req.url);
  res.send("Not Found", 404);
});

module.exports = router;
