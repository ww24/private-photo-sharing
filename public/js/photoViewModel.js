/* globals Vue */
/**
 * Photo Stream View Model
 */

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
        return data.photo_detail.contributor && ! data.photo_detail.contributor.id;
      }
    },
    filters: {
      dateFormat: function (date_str) {
        // "2014-01-01T12:05:30.000Z" => "2014/01/01 12:05:30"

        if (! date_str) {
          return "unknown";
        }

        var d = new Date(date_str);
        // fix timezone
        d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);

        function zeroPadding(num) {
          num = String(num);
          if (num.length > 1) {
            return num;
          }
          return "0" + num;
        }

        // time format 2014/01/01 12:05:30
        return [
          // 2014/01/01
          [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(zeroPadding).join("/"),
          // 12:05:30
          [d.getHours(), d.getMinutes(), d.getSeconds()].map(zeroPadding).join(":")
        ].join(" ");
      }
    }
  });

  Vue.component("add-photo-modal", photoViewModel);
  Vue.component("photo-detail-modal", photoViewModel);
})();
