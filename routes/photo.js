/**
 * Photo resource
 */

var express = require("express"),
    router = express.Router(),
    multer = require("multer"),
    mime = require("mime-magic"),
    im = require("imagemagick"),
    async = require("async"),
    path = require("path"),
    fs = require("fs"),
    libs = require("../libs"),
    models = require("../models");

router.get("/", function (req, res) {
  var photo_stream = {
    status: "ok",
    my_photos: null,
    photos: null
  };

  // 投稿者が自分の写真を取得
  models.Photo.find({contributor: req.user})
  .populate("viewers")
  .sort({created_at: -1})
  .exec()
  .then(function (my_photos) {
    photo_stream.my_photos = my_photos;
    // User model -> Twitter model
    return models.Twitter.findOne({id: req.user.id}).exec();
  })
  .then(function (account) {
    // 自分に共有されている写真を取得
    return models.Photo.find({viewers: account})
    .populate("contributor")
    .sort({created_at: -1})
    .exec();
  })
  .then(function (photos) {
    // success
    photo_stream.photos = photos;
    res.json(photo_stream);
  }, function (err) {
    // error
    res.status(500).json({
      status: "ng",
      error: "DB error"
    });
    console.error(err);
  });
});

// upload dir
var temp_dir = path.resolve(__dirname, "../temp");
var photo_dir = path.resolve(__dirname, "../public/photos");
var thumbs_dir = path.resolve(__dirname, "../public/thumbs");

// cleanup temp dir
fs.readdirSync(temp_dir).forEach(function (filename) {
  if (filename[0] === ".") {
    return;
  }

  fs.unlinkSync(path.join(temp_dir, filename));
});

// 写真の削除
function unlinkFile(filename) {
  fs.unlink(filename, function (err) {
    if (err) {
      console.error(err);
    }
  });
}
// 写真の保存
function saveFile(file, callback) {
  var req = this,
      error = null;

  libs.genid(function (err, id) {
    // id の存在確認
    models.Photo.findOne({id: id}, function (err, photo) {
      if (err) {
        unlinkFile(file.path);
        return callback(err);
      }

      // id が既に使われている場合は再度 id 生成
      if (photo !== null) {
        return saveFile.call(req, file, callback);
      }

      // JPEG 確認
      mime(file.path, function (err, type) {
        if (err) {
          unlinkFile(file.path);
          return callback(err);
        }

        // JPEG 以外の場合はエラー
        if (type !== "image/jpeg") {
          unlinkFile(file.path);
          error = new Error("invalid mime type");
          error.statusCode = 400;
          return callback(error);
        }

        // EXIF Data の取得
        im.readMetadata(file.path, function (err, metadata) {
          if (err) {
            console.error(err);
          }

          // DB へ保存
          models.Photo.create({
            id: id,
            name: file.originalname,
            size: file.size,
            contributor: req.user,
            viewers: req.body.viewers,
            exif: metadata && metadata.exif
          }, function (err) {
            if (err) {
              return callback(err);
            }

            // thumbnail の生成
            im.resize({
              srcPath: file.path,
              dstPath: path.join(thumbs_dir, id + ".jpg"),
              quality: 0.8,
              format: "jpg",
              progressive: true,
              width: 480
            }, function (err, stdout, stderr) {
              if (err) {
                console.error(stderr);
                return callback(err);
              }

              // photo dir へ移動
              fs.rename(file.path, path.join(photo_dir, id + ".jpg"), callback);
            });
          });
        });
      });
    });
  });
}

// upload photo (multiple)
router.post("/", multer({dest: temp_dir}));
router.post("/", function (req, res) {
  var photos = req.files.photo;
  var data = req.body;

  if (! photos || ! data.viewers) {
    return res.status(400).json({
      status: "ng",
      error: "Bad Request"
    });
  }

  // cast to Array
  if (! Array.isArray(data.viewers)) {
    data.viewers = [data.viewers];
  }

  // cast to Array
  if (! Array.isArray(photos)) {
    photos = [photos];
  }

  // override filename
  if (data.filename != null) {
    // cast to Array
    if (! Array.isArray(data.filename)) {
      data.filename = [data.filename];
    }

    photos = photos.map(function (photo, index) {
      photo.originalname = data.filename[index];
      return photo;
    });
  }

  if (data.viewers.length === 0) {
    return res.status(400).json({
      status: "ng",
      error: "Bad Request"
    });
  }

  // remove duplicate element from viewers
  data.viewers = data.viewers.filter(function (viewer, index, viewers) {
    return viewers.indexOf(viewer) === index;
  });

  libs.twitter.screenNameToId({
    key: req.user.key,
    secret: req.user.secret
  }, data.viewers, function (err, accounts) {
    if (err) {
      res.status(err.statusCode || 500).json({
        status: "ng",
        error: err.statusCode ? "twitter access error" : "DB error"
      });
      return console.error(err);
    }

    data.viewers = accounts;

    async.parallel(photos.map(function (file) {
      return saveFile.bind(req, file);
    }), function (err) {
      if (err) {
        var message = "save image error";
        if (err.message === "invalid mime type") {
          message = err.message;
        }
        res.status(err.statusCode || 500).json({
          status: "ng",
          error: message
        });
        return console.error(err);
      }

      res.json({status: "ok"});
    });
  });
});

// update photo data
router.put("/:id", function (req, res) {
  var data = req.body;

  if (! data.name && ! data.viewers) {
    return res.status(400).json({
      status: "ng",
      error: "Bad Request"
    });
  }

  // cast to Array
  if (! Array.isArray(data.viewers)) {
    data.viewers = [data.viewers];
  }

  if (data.viewers.length === 0) {
    return res.status(400).json({
      status: "ng",
      error: "Bad Request"
    });
  }

  // remove duplicate element from viewers
  data.viewers = data.viewers.filter(function (viewer, index, viewers) {
    return viewers.indexOf(viewer) === index;
  });

  libs.twitter.screenNameToId({
    key: req.user.key,
    secret: req.user.secret
  }, data.viewers, function (err, accounts) {
    if (err) {
      res.status(err.statusCode || 500).json({
        status: "ng",
        error: err.statusCode ? "twitter access error" : "DB error"
      });
      return console.error(err);
    }

    data.viewers = accounts;

    models.Photo.findOne({id: req.params.id})
    .populate("contributor")
    .exec()
    .then(function (photo) {
      // success

      if (req.user.id !== photo.contributor.id) {
        return res.status(403).json({
          status: "ng",
          error: "Forbidden"
        });
      }

      // update photo data
      data.name && (photo.name = data.name);
      data.viewers && (photo.viewers = data.viewers);
      photo.save(function (err) {
        if (err) {
          res.status(500).json({
            status: "ng",
            error: "update error"
          });
          return console.error(err);
        }

        res.json({
          status: "ok"
        });
      });
    }, function (err) {
      // error
      res.status(500).json({
        status: "ng",
        error: "DB error"
      });
      console.error(err);
    });
  });
});

// delete photo
router.delete("/:id", function (req, res) {
  models.Photo.findOne({id: req.params.id})
  .populate("contributor")
  .exec()
  .then(function (photo) {
    // success

    // id check
    if (req.user.id !== photo.contributor.id) {
      return res.status(403).json({
        status: "ng",
        error: "Forbidden"
      });
    }

    photo.remove(function (err) {
      if (err) {
        res.status(500).json({
          status: "ng",
          error: "remove error"
        });
        return console.error(err);
      }

      unlinkFile(path.join(photo_dir, req.params.id + ".jpg"));
      unlinkFile(path.join(thumbs_dir, req.params.id + ".jpg"));

      res.json({
        status: "ok"
      });
    });
  }, function (err) {
    // error
    res.status(500).json({
      status: "ng",
      error: "DB error"
    });
    console.error(err);
  });
});

module.exports = router;
