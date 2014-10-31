/**
 * photo id generator
 */

var crypto = require("crypto");

function genid(callback) {
  // 生成される ID の文字長は 8 * 3 文字
  crypto.randomBytes(6 * 3, function (err, buff) {
    if (err) {
      return callback(err);
    }

    callback(null, buff.toString("base64").split("/").join("-"));
  });
}

module.exports = genid;
