/* globals Vue */
/**
 * Private Photo Sharing
 */

Vue.component("add-photo-modal", Vue.extend({
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
      var $button = $("#add-photo-modal-submit").button("loading");

      $.ajax({
        method: $e.attr("method"),
        url: $e.attr("action"),
        processData: false,
        contentType: false,
        data: new FormData(e.target),
        dataType: "json"
      }).done(function (res) {
        if (res && res.status === "ok") {
          // close modal
          $(that.$el).modal("hide");
          // reset form
          that.viewers = [{value: ""}];
          e.target.reset();
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
    }
  }
}));

Vue.component("photo-stream", Vue.extend({
  data: {
    my_photos: [],
    photos: []
  },
  ready: function () {
    var that = this;

    $.getJSON("/photo", function (data) {
      that.my_photos = data.my_photos;
      that.photos = data.photos;
    });
  },
  methods: {
    refresh: function (e) {
      var that = this;

      var $e = $(e.target).button("loading");

      $.getJSON("/photo", function (data) {
        that.my_photos = data.my_photos;
        that.photos = data.photos;
        $e.button("reset");
      });
    }
  }
}));

Vue.config({delimiters: ["[", "]"]});
new Vue({
  el: document.body
});
