<?php

@include_once("config.php");
@include_once("common.php");

$db = dbconnect();
$username = $_POST["username"];
$password = $_POST["password"];

$rs = dbquery($db, "SELECT `username`,`displayname`,`role`,`jsoninfo` FROM `table_user` WHERE `username`=? and `password`=?", $username, $password);
if (is_object($rs)) {
  $user = $rs->fetch_object();
  if ($user) {
    $result->user = $user;
    $result->status = "ok";
    $_SESSION["username"] = $username;
  }
  $rs->close();
}

$db->close();

echo json_encode($result);

?>