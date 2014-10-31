jQuery(function($) {
  var handler = function(event) {
    var that = $(this);
    var callback = that.attr("data-target");
    $.ajax({
      type: that.attr("method"),
      url: that.attr("action"),
      data: that.serialize(),
      success: function(data, status) {
        if (typeof(data) === "string") {
          data = JSON.parse(data);
        }
        window[callback](data);
      }
    });
    event.preventDefault();
    return false;
  };
  $("form[data-async]").live("submit", handler);
  $("a[data-async]").live("click", handler);
});

jQuery.validator.addMethod("identifier", function(value, element) {
  return this.optional(element) || /^[A-Za-z]+[A-Za-z0-9_]*$/.test(value);
}, "Please specify a valid identifier.");

