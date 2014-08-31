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
  screen_name: {
    type: String,
    index: {unique: true},
    required: true
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
  next();
});

module.exports = mongoose.model("Twitter", schema);
