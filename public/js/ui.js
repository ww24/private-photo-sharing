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
        $("#photo-detail-modal").modal("hide");
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
