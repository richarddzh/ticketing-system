<?php

@include_once("config.php");
@include_once("common.php");

$db = dbconnect();
$username = "guest";
if (isset($_SESSION["username"])) {
  $username = $_SESSION["username"];
}

$rs = dbquery($db, "SELECT `username`,`displayname`,`role`,`jsoninfo` FROM `table_user` WHERE `username` = ?", $username);
if (is_object($rs)) {
  $result->user = $rs->fetch_object();
  $result->status = "ok";
  $rs->close();
}

$db->close();

echo json_encode($result);

?>