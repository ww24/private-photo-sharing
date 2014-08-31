/**
 * Home controller
 */

var express = require("express"),
    router = express.Router();

router.get("/", function (req, res) {
  res.locals.template = "home";

  res.render(res.locals.template);
});

module.exports = router;
