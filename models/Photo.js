/**
 * Photo Model
 *
 */

var mongoose = require("mongoose");

var schema = new mongoose.Schema({
  id: {
    type: String,
    index: {unique: true},
    required: true
  },
  name: {
    type: String,
    required: true
  },
  provider: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  viewer: {
    type: [mongoose.Schema.ObjectId],
    ref: "User"
  },
  exif: {
    type: Object
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

module.exports = mongoose.model("Photo", schema);
