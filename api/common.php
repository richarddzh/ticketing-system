<?php

error_reporting(0);
header("Content-Type: application/json");
session_start();

$result = new stdClass();
$result->status = "error";
$result->log = array();

function logline($msg, $class = "ok") {
  global $result;
  $log = new stdClass();
  $log->message = $msg;
  $log->class = $class;
  $result->log[] = $log;
  // echo $msg;
}

function mystrreplace($search, $replace, $subject) {
  $offset = 0;
  $index = 0;
  while (($pos = strpos($subject, $search, $offset)) !== false) {
    $replacement = $replace[$index % count($replace)];
    $subject = substr_replace($subject, $replacement, $pos, strlen($search));
    $offset = $pos + strlen($replacement);
    $index++;
  }
  return $subject;
}

function dbconnect() {
  global $DZ_DB_HOST, $DZ_DB_USER, $DZ_DB_PASSWORD, $DZ_DB_DBNAME, $DZ_DB_PORT;
  $mysqli = new mysqli($DZ_DB_HOST, $DZ_DB_USER, $DZ_DB_PASSWORD, $DZ_DB_DBNAME, $DZ_DB_PORT);
  if (mysqli_connect_error()) {
    logline("无法连接到数据库，请检查数据库地址、端口、用户名或者密码是否正确。", "error");
    logline("错误信息：MySQL Error: " . mysqli_connect_error(), "error");
  } else {
    logline("成功连接到 " . $_POST["dbHost"] . " 上的MySQL数据库。");
  }
  if (!$mysqli->set_charset("utf8")) {
    logline("无法设置数据库连接的字符集为utf8。", "error");
  }
  return $mysqli;
}

function dbstring($db, $val) {
  if (is_string($val)) {
    return "'" . $db->escape_string($val) . "'";
  }
  return strval($val);
}

function dbquery($db, $sql) {
  logline("执行SQL语句：$sql");
  $argc = func_num_args();
  $argv = func_get_args();
  for ($i = 2; $i < $argc; $i++) {
    $argv[$i] = dbstring($db, $argv[$i]);
  }
  $sql = mystrreplace("?", array_slice($argv, 2), $sql);
  // echo $sql;
  $result = $db->query($sql);
  if (!$result) {
    logline("执行SQL语句失败。", "error");
    logline("错误信息：MySQL Error: " . $db->error, "error");
  }
  return $result;
}

?>