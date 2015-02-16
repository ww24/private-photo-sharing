/* globals Vue */
/**
 * Photo Stream View Model
 */

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
        var screen_names = data.photos.filter(function (photo) {
          return photo.contributor !== null;
        }).map(function (photo) {
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
      var photo = JSON.parse(JSON.stringify(this[type][index]));

      // send data for photo-detail-modal
      var root = this.$root.$data;
      root.photo_detail = photo;
      root.photo_detail.viewers = root.photo_detail.viewers.map(function (viewer) {
        return {value: viewer.screen_name};
      });
      root.photo_detail.error_message = "";

      $("#photo-detail-modal").modal("show");
    }
  }
}));
