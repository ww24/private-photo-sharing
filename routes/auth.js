/**
 * Twitter OAuth
 */

var express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    TwitterStrategy = require("passport-twitter").Strategy,
    models = require("../models"),
    config = require("../config.json");

// initialize authenticate
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  models.User.findOne({id: id}, done);
});

passport.use(new TwitterStrategy(config.twitter, function (key, secret, profile, done) {
  var user = {
    id: profile._json.id,
    name: profile._json.name,
    screen_name: profile._json.screen_name,
    icon_url: profile._json.profile_image_url,
    key: key,
    secret: secret
  };

  // registered user
  models.User.findOne({id: user.id}, function (err, user_profile) {
    if (err) {
      console.error(err);
      return done(err);
    }

    if (user.id !== config.admin.twitter && user_profile === null) {
      err = new Error("account-unavailable");
      err.status = 403;
      return done(err);
    }

    if (user_profile === null) {
      user_profile = new models.User(user);
    } else {
      user_profile.name = user.name;
      user_profile.screen_name = user.screen_name;
      user_profile.icon_url = user.icon_url;
      user_profile.key = user.key;
      user_profile.secret = user.secret;
    }

    user_profile.save(function (err) {
      done(err, user);
    });
  });
}));

var token = Math.floor(Math.random() * Math.pow(10, 8));

// check authenticate session
router.get("/auth", function (req, res, next) {
  req.flash("authenticate");
  req.flash("authenticate", token);
  next();
});

// auth callback
router.get("/auth/twitter", function (req, res, next) {
  if (req.flash("authenticate")[0] === token) {
    return next();
  }

  req.session.status = "ng";
  req.flash("error", {message: "予期せぬ認証エラー。再認証してください。"});
  res.redirect(302, "/");
});

// google auth
router.get("/auth", passport.authenticate("twitter"));
router.get("/auth/twitter", passport.authenticate("twitter", {
  successRedirect: "/home",
  failureRedirect: "/auth/fail",
  failureFlash: true
}));

// authentication failure
router.get("/auth/fail", function (req, res) {
  console.error(req.flash("error"));
  req.flash("error", {message: "認証失敗"});
  res.redirect(302, "/");
});

// logout
router.get("/logout", function (req, res) {
  req.logout();
  req.session.destroy && req.session.destroy();
  req.session = null;
  res.redirect(302, "/");
});

module.exports = router;
