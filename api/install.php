<?php

header("Content-Type: application/json");
error_reporting(0);
$result = new stdClass();
$result->log = array();

function logline($msg) {
  global $result;
  $result->log[] = $msg;
}

do {
  $mysqli = new mysqli($_POST["dbHost"], $_POST["dbUser"], $_POST["dbPassword"], "", $_POST["dbPort"]);
  if (mysqli_connect_error()) {
    $result->status = "error";
    logline("无法连接到数据库，请检查数据库地址、端口、用户名或者密码是否正确。");
    logline("错误信息：MySQL Error: " . mysqli_connect_error());
    break;
  } else {
    logline("成功连接到 " . $_POST["dbHost"] . " 上的MySQL数据库。");
  }

  $result->status = "ok";
} while (false);

echo json_encode($result);

?>