<?php

@include_once("config.php");
@include_once("common.php");

function writeconfig($fp) {
  fwrite($fp, "<?php\n\$DZ_INSTALLED = true;\n");
  fwrite($fp, "\$DZ_DB_HOST = \"$_POST[dbHost]\";\n");
  fwrite($fp, "\$DZ_DB_PORT = \"$_POST[dbPort]\";\n");
  fwrite($fp, "\$DZ_DB_USER = \"$_POST[dbUser]\";\n");
  fwrite($fp, "\$DZ_DB_PASSWORD = \"$_POST[dbPassword]\";\n");
  fwrite($fp, "\$DZ_DB_DBNAME = \"$_POST[dbDatabaseName]\";\n");
  fwrite($fp, "?>\n");
}

do {
  if (isset($DZ_INSTALLED)) {
    logline("已经安装，请删除配置文件后重新安装。", "error");
    break;
  }

  $fp = fopen("config.php", "w");
  if ($fp) {
    logline("开始写入配置文件config.php。");
    writeconfig($fp);
    fclose($fp);
    logline("成功写入配置文件。");
  } else {
    logline("无法写入配置文件，请确保PHP对安装目录具有写权限。", "error");
    break;
  }

  $mysqli = new mysqli($_POST["dbHost"], $_POST["dbUser"], $_POST["dbPassword"], "", $_POST["dbPort"]);
  if (mysqli_connect_error()) {
    logline("无法连接到数据库，请检查数据库地址、端口、用户名或者密码是否正确。", "error");
    logline("错误信息：MySQL Error: " . mysqli_connect_error(), "error");
    break;
  } else {
    logline("成功连接到 " . $_POST["dbHost"] . " 上的MySQL数据库。");
  }

  if (!$mysqli->set_charset("utf8")) {
    logline("无法设置数据库连接的字符集为utf8。", "error");
    break;
  }
  if (!dbquery($mysqli, "CREATE DATABASE `$_POST[dbDatabaseName]`")) break;
  if (!$mysqli->select_db($_POST["dbDatabaseName"])) {
    logline("无法使用数据库。", "error");
    break;
  }

  if (!dbquery($mysqli, <<<MYSQL
    CREATE TABLE `table_user` (
      `username`      VARCHAR(16),
      `password`      VARCHAR(32) NOT NULL,
      `displayname`   VARCHAR(16) NOT NULL,
      `role`          VARCHAR(16) NOT NULL,
      `jsoninfo`      VARCHAR(512) NOT NULL,
      PRIMARY KEY     (`username`)
    ) DEFAULT CHARSET=utf8 COLLATE=utf8_bin
MYSQL
)) break;
  if (!dbquery($mysqli, <<<MYSQL
    CREATE TABLE `table_type` (
      `name`          VARCHAR(32),
      `jsoninfo`      VARCHAR(512) NOT NULL,
      PRIMARY KEY     (`name`)
    ) DEFAULT CHARSET=utf8 COLLATE=utf8_bin
MYSQL
  )) break;
  if (!dbquery($mysqli, <<<MYSQL
    CREATE TABLE `table_ticket` (
      `id`            INT AUTO_INCREMENT,
      `createuser`    VARCHAR(16) NOT NULL,
      `owner`         VARCHAR(16) NOT NULL,
      `devicetype`    VARCHAR(32) NOT NULL,
      `devicemodal`   VARCHAR(32) NOT NULL,
      `status`        VARCHAR(16) NOT NULL,
      `createtime`    TIMESTAMP NOT NULL,
      `updatetime`    TIMESTAMP NOT NULL,
      `jsoninfo`      VARCHAR(512) NOT NULL,
      PRIMARY KEY     (`id`)
    ) DEFAULT CHARSET=utf8 COLLATE=utf8_bin
MYSQL
  )) break;
  if (!dbquery($mysqli, <<<MYSQL
    CREATE TABLE `table_record` (
      `id`            INT AUTO_INCREMENT,
      `ticketid`      INT NOT NULL,
      `recorder`      VARCHAR(16) NOT NULL,
      `follower`      VARCHAR(16) NOT NULL,
      `recordtime`    TIMESTAMP NOT NULL,
      `jsoninfo`      VARCHAR(512) NOT NULL,
      PRIMARY KEY     (`id`)
    ) DEFAULT CHARSET=utf8 COLLATE=utf8_bin
MYSQL
  )) break;
  if (!dbquery($mysqli, <<<MYSQL
    INSERT INTO `table_user` (`username`,`password`,`displayname`,`role`,`jsoninfo`) 
    VALUES (?,?,'管理员','administrator','{}'), ('guest','guest','未登录','guest','{}')
MYSQL
  , $_POST["sysAdmin"], $_POST["sysPassword"])) break;

  $mysqli->close();

  logline("成功创建数据库，添加管理员用户。");
  logline("安装完成。");

  $result->status = "ok";
} while (false);

echo json_encode($result);

?>