$().ready(function() {
  $("#form-login").validate({
    rules: {
      username: "required",
      password: "required"
    },
    messages: {
      username: "输入用户名",
      password: "输入密码"
    }
  });
  $.post("/api/login-user.php", function(result) {
    on_login(result);
  });
});

function on_login(result) {
  if (result && result.user) {
    $(".data-username").text(result.user.jsoninfo.name || result.user.id);
    $(".data-user-id").text(result.user.id);
    $("#form-login").css("display", "none");
    $(".require-login").css("display", "block");
    if (result.user.role === "admin") {
      $(".require-admin").css("display", "block");
    } else {
      $(".require-admin").css("display", "none");
    }
  } else {
    if (result.alert === true) {
      alert("登录失败，请检查输入的用户名和密码是否正确。");
    }
    on_logout();
  }
}

function on_logout(result) {
  $("#form-login").css("display", "block");
  $(".require-login").css("display", "none");
}
