var fs = require("fs");
var path = require("path");
var mysql = require("mysql");

var config = {};
var configPath = path.join(__dirname, "config.json");
var mysqlPool;

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, {encoding:"utf8"}));
}

var configure = {
  write: function(conf, callback) {
    if (mysqlPool !== undefined) {
      mysqlPool.end();
    }
    mysqlPool = undefined;
    config = conf;
    fs.writeFile(configPath, JSON.stringify(conf), callback);
  },
  exists: function() {
    return fs.existsSync(configPath);
  }
};

var db = {
  init: function(conf, sql, callback) {
    var conn = mysql.createConnection({
      host: conf.dbHost,
      port: parseInt(conf.dbPort, 10),
      user: conf.dbUser,
      password: conf.dbPassword,
      multipleStatements: true
    });
    conn.connect();
    conn.query(sql, callback);
    conn.end();
  },
  connectionPool: function() {
    if (mysqlPool !== undefined) return mysqlPool;
    mysqlPool = mysql.createPool({
      host: config.dbHost,
      port: parseInt(config.dbPort, 10),
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbDatabaseName
    });
    return mysqlPool;
  },
  query: function(sql, args, callback) {
    var pool = this.connectionPool();
    pool.query(sql, args, callback);
  },
  escape: function(val) {
    return mysql.escape(val);
  },
  escapeId: function(id) {
    return mysql.escapeId(id);
  },
  makeQueryHandler: function(res, output, message, updateRows, next) {
    if (updateRows === undefined) updateRows = 1;
    if (message === undefined) message = "更新的行数不是" + updateRows;
    if (output === undefined) output = {};
    if (next === undefined) next = function() { res.send(output); };
    return function(error, result) {
      if (error) {
        output.error = JSON.stringify(error);
        output.message = "数据库无法完成更新。";
        res.send(output);
      } else if (result.affectedRows !== 1) {
        output.error = "not updated";
        output.message = message;
        res.send(output);
      } else {
        output.result = result;
        next();
      }
    };
  }
};

module.exports.config = configure;
module.exports.database = db;
