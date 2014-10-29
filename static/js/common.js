// form attribute data-async
//   With this attribute, form submission is handled by the following code. 
//   It sends the form data asynchronously to the action path.
//   And call the data-target attribute as a global function that takes the response data as argument.
jQuery(function($) {
  $("form[data-async]").live("submit", function(event) {
    var $form = $(this);
    var $target = $form.attr("data-target");

    $.ajax({
      type: $form.attr('method'),
      url: $form.attr('action'),
      data: $form.serialize(),

      success: function(data, status) {
        console.log(data);
        if (typeof(data) === "string") {
          data = JSON.parse(data);
        }
        window[$target](data);
      }
    });
    
    event.preventDefault();
  });
});

jQuery.validator.addMethod("identifier", function(value, element) {
  return this.optional(element) || /^[A-Za-z]+[A-Za-z0-9_]*$/.test(value);
}, "Please specify a valid identifier.");