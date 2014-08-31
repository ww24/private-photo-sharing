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
  size: {
    type: Number,
    required: true
  },
  contributor: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  viewers: {
    type: [Number]
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

schema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Photo", schema);
