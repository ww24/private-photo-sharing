/**
 * Twitter ID <-> screen_name
 *
 */

var ntwitter = require("ntwitter"),
    https = require("https"),
    url = require("url"),
    models = require("../models"),
    config = require("config");

var twitter = {};

// id -> screen_name
twitter.idToScreenName = function (id, callback) {
  https.request({
    method: "head",
    hostname: "twitter.com",
    path: "/account/redirect_by_id/" + id
  }, function (res) {
    if (! res.headers.location) {
      var err = new Error("not found");
      err.status = res.statusCode;
      return callback && callback(err);
    }

    var screen_name = url.parse(res.headers.location).pathname.slice(1);
    callback && callback(null, screen_name);
  }).on("error", function (err) {
    console.error(err);
    callback && callback(err);
  }).end();
};

function screen_name_map(screen_name) {
  return {screen_name: screen_name};
}

// screen_name(s) -> id(s)
twitter.screenNameToId = function (access_token, screen_names, callback) {
  var ids = [];

  // screen_names が 0 件なら空の結果を返す
  if (screen_names.length === 0) {
    return callback && callback(ids);
  }

  // callback を呼ぶためのチェック
  function check(users) {
    // screen_names と ids の更新
    [].push.apply(ids, users.map(function (user) {
      // remove screen_name in screen_names
      var index = screen_names.indexOf(user.screen_name);
      screen_names.splice(index, 1);
      return user.id;
    }));

    // screen_names が空なら抜け出す
    if (screen_names.length === 0) {
      return true;
    }
  }

  // ユーザ情報からの検索
  var query = models.User.find();
  query.or(screen_names.map(screen_name_map));
  query.exec(function (err, users) {
    if (err) {
      return callback && callback(err);
    }

    if (check(users)) {
      return callback && callback(null, ids);
    }

    // キャッシュからの検索
    var query = models.Twitter.find();
    query.or(screen_names.map(screen_name_map));
    query.exec(function (err, users) {
      if (err) {
        return callback && callback(err);
      }

      if (check(users)) {
        return callback && callback(null, ids);
      }

      var tw = new ntwitter({
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token_key: access_token.key,
        access_token_secret: access_token.secret
      });

      // Twitter API 呼び出し
      if (screen_names.length === 1) {
        // 1 ユーザ検索
        // https://dev.twitter.com/docs/api/1.1/get/users/show
        tw.get("/users/show.json", {
          screen_name: screen_names[0]
        }, function (err, data) {
          if (err) {
            return callback && callback(err);
          }

          models.Twitter.create(data, function (err) {
            if (err) {
              return callback && callback(err);
            }

            ids.push(data.id);
            callback && callback(null, ids);
          });
        });
      } else {
        // 複数ユーザ検索
        // https://dev.twitter.com/docs/api/1.1/get/users/lookup
        tw.get("/users/lookup.json", {
          screen_name: screen_names.join(",")
        }, function (err, data) {
          if (err) {
            return callback && callback(err);
          }

          models.Twitter.create(data, function (err) {
            if (err) {
              return callback && callback(err);
            }

            [].push.apply(ids, data.map(function (d) {
              return d.id;
            }));
            callback && callback(null, ids);
          });
        });
      }
    });
  });
};

module.exports = twitter;
