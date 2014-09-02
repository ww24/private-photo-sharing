/* globals Vue */
/**
 * Private Photo Sharing
 */

Vue.config({
  delimiters: ["[", "]"]
});

(function () {
  function download(url, filename) {
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || url.split("/").slice(-1)[0];
    a.click();
  }

  var photoViewModel = Vue.extend({
    data: {
      viewers: [{value: ""}],
      error_message: ""
    },
    methods: {
      add: function () {
        this.viewers.push({value: ""});
      },
      remove: function (index) {
        this.viewers.splice(index, 1);
      },
      submit: function (e) {
        e.preventDefault();

        var that = this;
        this.error_message = "";

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
          options.data = new FormData(e.target);
        }

        $.ajax(options).done(function (res) {
          if (res && res.status === "ok") {
            // close modal
            $(that.$el).modal("hide");
            // reset form
            that.viewers = [{value: ""}];
            e.target.reset();
            that.$root.$broadcast("refresh");
          } else {
            that.error_message = "server error";
          }
        }).fail(function (req) {
          console.error(req);
          if (req.status === 404) {
            that.error_message = "screen name が見つかりません。";
          } else {
            that.error_message = "network error";
          }
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
            that.error_message = "server error";
          }
        }).fail(function (req) {
          console.error(req);
          that.error_message = "network error";
        }).always(function () {
          $delete.button("reset");
        });
      },
      open: function () {
        var file = "/photos/" + this.$root.$data.photo_detail.id + ".jpg";
        // open new tab
        open(file);
      },
      download: function () {
        var file = "/photos/" + this.$root.$data.photo_detail.id + ".jpg";
        var name = this.$root.$data.photo_detail.name;
        // download image file
        download(file, name);
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
      photos: []
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

        this.$root.$data.photo_detail = photo;

        $("#photo-detail-modal").modal("show");
      },
      download: function (index) {
        var photo = this.photos[index];
        var file = "/photos/" + photo.id + ".jpg";
        var name = photo.name;
        // download image file
        download(file, name);
      }
    }
  }));

  Vue.component("photo-detail-modal", photoViewModel);

  new Vue({
    el: document.body,
    data: {
      photo_detail: {}
    },
    methods: {
      stopEvent: function (e) {
        e.stopPropagation();
      }
    }
  });
})();
