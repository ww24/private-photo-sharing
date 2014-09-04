/**
 * User Model
 *
 */

var mongoose = require("mongoose");

var schema = new mongoose.Schema({
  id: {
    type: Number,
    index: {unique: true},
    required: true
  },
  name: {
    type: String,
    required: true
  },
  screen_name: {
    type: String,
    index: {unique: true},
    required: true
  },
  icon_url: {
    type: String
  },
  key: {
    type: String
  },
  secret: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true
  }
});

schema.pre("save", function (next) {
  this.updated_at = Date.now();

  var user = this;
  // sync Twitter model
  var Twitter = mongoose.model("Twitter");
  Twitter.findOne({id: user.id}, function (err, twitter) {
    if (err) {
      console.error();
    }

    if (twitter === null) {
      twitter = new Twitter();
    }

    twitter.id = user.id;
    twitter.screen_name = user.screen_name;
    twitter.save(function (err) {
      if (err) {
        console.error(err);
      }

      next();
    });
  });
});

module.exports = mongoose.model("User", schema);
