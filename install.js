var fs = require("fs");
var path = require("path");
var common = require("./common.js");
var config = common.config;
var db = common.database;

var install = function(req, res) {
  var params = req.body;
  var callback = function(output) { res.send(output); };
  
  var result = {log: []};
  result.logLine = function(msg, level) {
    level = level || "ok";
    this.log.push({message: msg, level: level});
    console.log(level + ": " + msg);
  };

  if (config.exists()) {
    result.logLine("配置文件已经存在，请删除配置文件之后再进行安装。", "error");
    callback(result);
    return;
  }

  var sql = fs.readFileSync(path.join(__dirname, "install.sql"), {encoding: "utf8"});
  sql = sql.replace(/\$db\$/gm, db.escapeId(params.dbDatabaseName));
  sql = sql.replace(/\$admin\$/gm, db.escape(params.sysAdmin));
  sql = sql.replace(/\$password\$/gm, db.escape(params.sysPassword));

  db.init(params, sql, function(errDB) {
    if (errDB) {
      result.logLine("初始化数据库失败。", "error");
      result.logLine("MySQL: " + errDB, "error");
      callback(result);
    } else {
      result.logLine("成功完成数据库创建和初始化。");
      config.write(params, function(errFS) {
        if (errFS) {
          result.logLine("写入配置文件失败，请检查目录权限。", "error");
        } else {
          result.logLine("写入配置文件，安装完成。");
        }
        callback(result);
      });
    }
  });
};

module.exports = install;

/*
install({
  dbHost:"localhost",
  dbPort:"3306",
  dbUser:"root",
  dbPassword:"root",
  dbDatabaseName:"db_ticketing",
  sysAdmin:"admin",
  sysPassword:"",
  sysPassword2:""});
*/