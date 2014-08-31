/**
 * Home controller
 */

var express = require("express"),
    router = express.Router();

router.get("/", function (req, res) {
  res.locals.template = "photo";

  res.render(res.locals.template);
});

router.post("/", function (req, res) {

});

router.delete("/:id", function (req, res) {

});

module.exports = router;
