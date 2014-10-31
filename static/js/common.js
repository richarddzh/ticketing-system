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
        // console.log(data);
        if (typeof(data) === "string") {
          data = JSON.parse(data);
        }
        window[$target](data);
      }
    });
    
    event.preventDefault();
  });

  $("a[data-async]").live("click", function(event) {
    var $anchor = $(this);
    var $target = $anchor.attr("data-target");

    $.ajax({
      type: $anchor.attr('method'),
      url: $anchor.attr('action'),

      success: function(data, status) {
        // console.log(data);
        if (typeof(data) === "string") {
          data = JSON.parse(data);
        }
        window[$target](data);
      }
    });
    
    event.preventDefault();
    return false;
  });
});

jQuery.validator.addMethod("identifier", function(value, element) {
  return this.optional(element) || /^[A-Za-z]+[A-Za-z0-9_]*$/.test(value);
}, "Please specify a valid identifier.");

/****************************
  user login 
*****************************/
function login(data) {
  if (!data || !data.user || !data.user.role || data.user.role === "guest") {
    alert("登录失败，请确认输入的用户名和密码是正确的。");
  } else {
    update_user(data.user);
  }
}

function update_login() {
  $.ajax({
    type: "get",
    url: "../api/loginuser.php",
    success: function(data, status) {
      if (typeof(data) === "string") {
        data = JSON.parse(data);
      }
      update_user(data.user);
    }
  });
}

function update_user(user) {
  if (!user || !user.role || user.role === "guest") {
    $(".logged-in").css("display", "none");
    $(".logged-out").css("display", "block");
  } else {
    $(".logged-in").css("display", "block");
    $(".logged-out").css("display", "none");
  }
  $(".data-username").text(user.displayname);
}
