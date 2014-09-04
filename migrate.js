/**
 * 既存の Photo データを新しい Schema へ適用させる
 * NODE_ENV=production node migrate で単体で呼び出す
 */

var async = require("async"),
    mongoose = require("mongoose"),
    models = require("./models");

userAndTwitterModelMigration();

// User を全件取り出してそれぞれ保存する
// (User model の save event が呼ばれて Twitter model へコピーされる)
function userAndTwitterModelMigration() {
  models.User.find(function (err, users) {
    if (err) throw err;

    async.parallel(users.map(function (user) {
      return user.save.bind(user);
    }), function (err) {
      if (err) throw err;

      photoModelMigration();
    });
  });
}

// viewers を id から Twitter model の ObjectId へ変更する
function photoModelMigration() {
  models.Photo.find(function (err, photos) {
    if (err) throw err;

    async.parallel(photos.map(function (photo) {
      var viewers = photo.viewers.map(function (viewer) {
        return {id: viewer};
      });

      return function (done) {
        models.Twitter.find.apply(models.Twitter, viewers)
        .exec(function (err, accounts) {
          console.log(accounts);
          photo.viewers = accounts.map(function (account) {
            return account._id;
          });
          photo.save(done);
        });
      };
    }), function (err) {
      if (err) throw err;

      console.log("migration complete.");
      mongoose.disconnect();
    });
  });
}
