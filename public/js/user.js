/**
 * User Manager
 */

$(function () {
  $("#add-user").submit(function (e) {
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
});
