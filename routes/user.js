/**
 * User resource
 */

var express = require("express"),
    router = express.Router(),
    models = require("../models");

router.get("/", function (req, res) {
  res.locals.users = [];
  res.locals.template = "user";

  models.User.find(function (err, users) {
    if (err) {
      res.send("DB Error", 500);
      return console.error(err);
    }

    res.locals.users = users;
    res.render(res.locals.template);
  });
});

router.post("/", function (req, res) {

});

router.put("/:id", function (req, res) {

});

router.delete("/:id", function (req, res) {

});

module.exports = router;
