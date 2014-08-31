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
      var $e = $(e.target);

      $.ajax({
        method: $e.attr("method"),
        url: $e.attr("action"),
        processData: false,
        contentType: false,
        data: new FormData(e.target),
        dataType: "json"
      }).done(function (res) {
        console.log(res);
      }).fail(function (req) {
        console.error(req);
        that.error_message = "network error";
      });
    }
  }
}));

Vue.config({delimiters: ["[", "]"]});
new Vue({
  el: document.body
});
