/**
 * User resource
 */

var express = require("express"),
    router = express.Router(),
    models = require("../models"),
    libs = require("../libs");

router.get("/", function (req, res) {
  res.locals.users = [];
  res.locals.template = "user";
  res.locals.title = "UserManager | ";

  models.User.find(function (err, users) {
    if (err) {
      res.status(500).send("DB Error");
      return console.error(err);
    }

    res.locals.users = users;
    res.render(res.locals.template);
  });
});

// add user
router.post("/", function (req, res) {
  var screen_name = req.body.screen_name;

  libs.twitter.screenNameToId({
    key: req.user.key,
    secret: req.user.secret
  }, [screen_name], function (err, accounts) {
    if (err) {
      res.status(err.statusCode || 500).json({
        status: "ng",
        error: err.statusCode ? "twitter access error" : "DB error"
      });
      return console.error(err);
    }

    models.User.create({
      id: accounts[0].id,
      screen_name: accounts[0].screen_name,
      name: "未認証"
    }, function (err) {
      if (err) {
        res.status(500).json({
          status: "ng",
          error: "DB Error"
        });
        return console.error(err);
      }

      res.json({status: "ok"});
    });
  });
});

// update user
router.put("/:id", function (req, res) {
  // 未実装
});

// delete user
router.delete("/:id", function (req, res) {
  models.User.remove({
    id: req.params.id
  }).exec().then(function () {
    // success
    res.json({status: "ok"});
  }, function (err) {
    // error
    res.json({
      status: "ng",
      error: "DB Error"
    });
    console.error(err);
  });
});

module.exports = router;
