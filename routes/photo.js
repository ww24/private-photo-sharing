/**
 * Photo resource
 */

var express = require("express"),
    router = express.Router(),
    multer = require("multer"),
    mime = require("mime-magic"),
    im = require("imagemagick"),
    path = require("path"),
    fs = require("fs"),
    libs = require("../libs"),
    models = require("../models");

router.get("/", function (req, res) {
  models.Photo.find({contributor: req.user})
  .sort({created_at: -1})
  .exec(function (err, my_photos) {
    if (err) {
      return res.status(500).json({
        status: "ng",
        errors: ["DB error"]
      });
    }

    models.Photo.find({viewers: req.user.id})
    .sort({created_at: -1})
    .populate("contributor")
    .exec(function (err, photos) {
      if (err) {
        return res.status(500).json({
          status: "ng",
          errors: ["DB error"]
        });
      }

      res.json({
        my_photos: my_photos,
        photos: photos
      });
    });
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
  var req = this;

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
          return callback(new Error("invalid mime type"));
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
              console.error(err);
            }
          });

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
              console.error(err, stderr);
            }

            // photo dir へ移動
            fs.rename(file.path, path.join(photo_dir, id + ".jpg"), callback);
          });
        });
      });
    });
  });
}

// upload photo (multiple)
router.post("/", multer({dest: temp_dir}));
router.post("/", function (req, res) {
  var photo = req.files.photo;
  var data = req.body;

  if (! photo) {
    return res.status(400).send({
      status: "ng",
      error: "Bad Request"
    });
  }

  if (! (data.viewers instanceof Array)) {
    data.viewers = [data.viewers];
  }

  libs.twitter.screenNameToId({
    key: req.user.key,
    secret: req.user.secret
  }, data.viewers, function (err, ids) {
    if (err) {
      res.status(err.statusCode).json({
        status: "ng",
        error: "twitter access error"
      });
      return console.error(err);
    }

    data.viewers = ids;

    if (photo instanceof Array) {
      photo.forEach(function (file, index) {
        saveFile.call(req, file, function () {
          ! index || res.json({status: "ok"});
        });
      });
    } else {
      saveFile.call(req, photo, function () {
        res.json({status: "ok"});
      });
    }
  });
});

// update photo data
router.put("/:id", function (req, res) {
  var data = req.body;
  if (! data.name && ! data.viewers) {
    return res.status(400).send("Bad Request");
  }

  if (! (data.viewers instanceof Array)) {
    data.viewers = [data.viewers];
  }

  libs.twitter.screenNameToId({
    key: req.user.key,
    secret: req.user.secret
  }, data.viewers, function (err, ids) {
    if (err) {
      res.status(err.statusCode).json({
        status: "ng",
        error: "twitter access error"
      });
      return console.error(err);
    }

    data.viewers = ids;

    models.Photo.findOne({id: req.params.id}).populate("contributor").exec(function (err, photo) {
      if (req.user.id !== photo.contributor.id) {
        return res.status(403).send("Forbidden");
      }

      data.name && (photo.name = data.name);
      data.viewers && (photo.viewers = data.viewers);
      photo.save(function (err) {
        if (err) {
          res.status(500).send("remove error");
          return console.error(err);
        }

        res.send("ok");
      });
    });
  });
});

// delete photo
router.delete("/:id", function (req, res) {
  models.Photo.findOne({id: req.params.id}).populate("contributor").exec(function (err, photo) {
    if (req.user.id !== photo.contributor.id) {
      return res.status(403).send("Forbidden");
    }

    photo.remove(function (err) {
      if (err) {
        res.status(500).send("remove error");
        return console.error(err);
      }

      unlinkFile(path.join(photo_dir, req.params.id + ".jpg"));
      unlinkFile(path.join(thumbs_dir, req.params.id + ".jpg"));
      res.send("ok");
    });
  });
});

module.exports = router;
