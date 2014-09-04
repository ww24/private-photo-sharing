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

// screen_name(s) -> id(s) (Twitter model object {_id, id, screen_name})
twitter.screenNameToId = function (access_token, screen_names, callback) {
  var users = [];

  // screen_names が 0 件なら空の結果を返す
  if (screen_names.length === 0) {
    return callback && callback(users);
  }

  // キャッシュからの検索
  var query = models.Twitter.find();
  query.or(screen_names.map(function (screen_name) {
    return {screen_name: screen_name};
  }));
  query.exec(function (err, accounts) {
    if (err) {
      return callback && callback(err);
    }

    // screen_names と users の更新
    [].push.apply(users, accounts.map(function (account) {
      // remove screen_name in screen_names
      var index = screen_names.indexOf(account.screen_name);
      screen_names.splice(index, 1);
      return account;
    }));

    // screen_names が空なら抜け出す
    if (screen_names.length === 0) {
      return callback && callback(null, users);
    }

    // twitter access token settings
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

        models.Twitter.create(data, function (err, account) {
          if (err) {
            return callback && callback(err);
          }

          users.push(account);
          callback && callback(null, users);
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

        models.Twitter.create(data, function (err, accounts) {
          if (err) {
            return callback && callback(err);
          }

          [].push.apply(users, accounts);
          callback && callback(null, users);
        });
      });
    }
  });
};

module.exports = twitter;
