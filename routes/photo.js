/**
 * Photo resource
 */

var express = require("express"),
    router = express.Router(),
    fs = require("fs");

router.get("/", function (req, res) {
  res.locals.template = "photo";

  res.render(res.locals.template);
});

router.post("/", function (req, res) {
  console.log(req.files);
  console.log(req.body);

  res.send("ok");
});

router.delete("/:id", function (req, res) {

});

module.exports = router;
