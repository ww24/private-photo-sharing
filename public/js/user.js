/**
 * User Manager
 */

$(function () {
  var $form = $("#add-user");

  $form.submit(function (e) {
    e.preventDefault();

    var $form = $(this);

    $.ajax({
      method: $form.attr("method"),
      url: $form.attr("action"),
      dataType: "json",
      data: $form.serialize()
    }).done(function (res) {
      console.log(res);
      location.reload(true);
    }).fail(function (req) {
      console.error(req);
      alert("server error");
    });
  });

  $("#users .delete").click(function () {
    var $el = $(this);

    var id = $el.data("id");

    if (! confirm("本当に id = " + id + " を削除しますか？")) {
      return false;
    }

    $.ajax({
      method: "delete",
      url: "/user/" + id + "?" + $form.attr("action").split("?")[1],
      dataType: "json"
    }).done(function (res) {
      console.log(res);
      location.reload(true);
    }).fail(function (req) {
      console.error(req);
      alert("server error");
    });
  });
});
