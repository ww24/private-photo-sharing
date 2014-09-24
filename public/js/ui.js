/* globals Vue */
/**
 * Private Photo Sharing
 */

// for IE9
if (! window.console) {
  var log = function () {};
  var method_list = "log,info,warn,error,dir,trace,time,timeEnd,group,groupEnd,groupCollapsed";
  method_list.split(",").forEach(function (method) {
    window.console[method] = log;
  });
}

Vue.config({
  delimiters: ["[", "]"]
});

(function () {
  var photoViewModel = Vue.extend({
    data: {
      viewers: [{value: ""}],
      error_message: ""
    },
    methods: {
      add: function () {
        this.$data.viewers.push({value: ""});
      },
      remove: function (index) {
        this.$data.viewers.splice(index, 1);
      },
      submit: function (e) {
        e.preventDefault();

        var that = this;
        this.$data.error_message = "";

        var $e = $(e.target);
        var $button = $("button.submit-button").button("loading");

        var options = {
          method: $e.attr("method"),
          url: $e.attr("action"),
          data: $e.serialize(),
          dataType: "json"
        };

        // for multipart/form-data
        if (options.method === "post") {
          options.processData = false;
          options.contentType = false;
          var fd = new FormData(e.target);
          var files = this.$root.$data.files;
          files.forEach(function (file) {
            fd.append("photo", file);
          });
          options.data = fd;
        }

        $.ajax(options).done(function (res) {
          if (res && res.status === "ok") {
            // close modal
            $(that.$el).modal("hide");
            // reset form
            that.$data.viewers = [{value: ""}];
            that.$root.$data.files = [];
            e.target.reset();
            that.$root.$broadcast("refresh");
          } else {
            that.$data.error_message = "server error";
          }
        }).fail(function (req) {
          console.error(req);
          var res = {};

          try {
            res = JSON.parse(req.responseText);
          } catch (e) {
            console.error(e);
          }

          var error_message = "network error";
          switch (req.status) {
            case 400:
              if (res.error === "invalid mime type") {
                error_message = "不正なファイル形式です。写真には正しい JPEG ファイルを選択して下さい。";
              }
              break;
            case 404:
              error_message = "screen name が見つかりません。";
              break;
            case 413:
              error_message = "一度にアップロードできるファイルサイズを超えています。";
              break;
            case 500:
              error_message = "server error";
              break;
          }

          that.$data.error_message = error_message;
        }).always(function () {
          $button.button("reset");
        });
      },
      delete: function (e) {
        e.preventDefault();

        var that = this;

        if (! confirm("写真を削除しますか？\nこの操作は取り消しできません。")) {
          return;
        }

        var $form = $(this.$el).find("form");
        var $delete = $("#add-photo-modal-delete").button("loading");
        var _csrf = $form.attr("action").split("_csrf=")[1];
        var id = this.$root.$data.photo_detail.id;

        $.ajax({
          method: "delete",
          url: "/photo/" + id,
          data: {
            _csrf: _csrf
          },
          dataType: "json"
        }).done(function (res) {
          if (res && res.status === "ok") {
            // close modal
            $(that.$el).modal("hide");
            that.$root.$broadcast("refresh");
          } else {
            that.$data.error_message = "server error";
          }
        }).fail(function (req) {
          console.error(req);
          that.$data.error_message = "network error";
        }).always(function () {
          $delete.button("reset");
        });
      },
      open: function () {
        var file = "/photos/" + this.$root.$data.photo_detail.id + ".jpg";
        // open new tab
        open(file);
      },
      checkPermission: function () {
        var data = this.$root.$data;
        return ! (data.photo_detail.contributor && data.photo_detail.contributor.id);
      }
    }
  });

  Vue.component("add-photo-modal", photoViewModel);

  Vue.component("photo-stream", Vue.extend({
    data: {
      my_photos: [],
      photos: [],
      screen_names: []
    },
    ready: function () {
      var that = this;
      var $refresh = $(this.$el).find("button.refresh");

      this.$on("refresh", function () {
        $refresh.button("loading");

        $.getJSON("/photo", function (data) {
          that.$data.my_photos = data.my_photos;
          that.$data.photos = data.photos;
          $refresh.button("reset");

          // 写真の共有元、共有先から screen_name 一覧の取得
          // map
          var screen_names = data.photos.map(function (photo) {
            return photo.contributor.screen_name;
          });
          var viewers = data.my_photos.map(function (photo) {
            return photo.viewers.map(function (viewer) {
              return viewer.screen_name;
            });
          });
          // flatten
          screen_names = [].concat.apply(screen_names, viewers);
          // unique
          screen_names = screen_names.filter(function (screen_name, index, arr) {
            return arr.indexOf(screen_name) === index;
          });
          that.$data.screen_names = screen_names;
        });
      });

      this.$emit("refresh");
    },
    methods: {
      refresh: function () {
        this.$emit("refresh");
      },
      open: function (type, index) {
        var photo = this[type][index];

        // send data for photo-detail-modal
        var root = this.$root.$data;
        root.photo_detail = JSON.parse(JSON.stringify(photo));
        root.photo_detail.viewers = root.photo_detail.viewers.map(function (viewer) {
          return {value: viewer.screen_name};
        });
        root.photo_detail.error_message = "";

        $("#photo-detail-modal").modal("show");
      }
    }
  }));

  Vue.component("photo-detail-modal", photoViewModel);

  new Vue({
    el: document.body,
    data: {
      photo_detail: {},
      files: []
    },
    methods: {
      stopEvent: function (e) {
        e.stopPropagation();
      },
      cancelEvent: function (e) {
        e.preventDefault();
      },
      drop: function (e) {
        e.preventDefault();

        var files = [].slice.call(e.dataTransfer.files);
        var file_count = files.length;
        files = files.filter(function (file) {
          return file.type === "image/jpeg";
        });
        if (file_count !== files.length) {
          alert("JPEG 画像以外はアップロードできません。");
        }
        this.$data.files.push.apply(this.$data.files, files);

        $("#droparea").removeClass("dragover");
      },
      dragenter: function (e) {
        if ($(e.target).hasClass("droparea")) {
          $("#add-photo-modal").modal("show");
        } else {
          $("#droparea").addClass("dragover");
        }
      },
      dragleave: function () {
        $("#droparea").removeClass("dragover");
      },
      removeFile: function (index) {
        this.$data.files.splice(index, 1);
      }
    }
  });
})();
