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
    pool.query(sql, args, function(error, result) {
      if (error || !result) {
        console.log("ERROR query: " + sql);
        console.log(error || "empty result.");
      }
      callback(result);
    });
  },
  escape: function(val) {
    return mysql.escape(val);
  },
  escapeId: function(id) {
    return mysql.escapeId(id);
  }
};

var asyncConcat = function(tasks, arg) {
  if (!Array.isArray(tasks) || tasks.length < 1) return;
  tasks[0](arg, function(out) {
    asyncConcat(tasks.slice(1), out);
  });
};

var async = {
  concat: asyncConcat,
  query: function(sql, sqlArg) {
    return function(arg, next) {
      if (typeof(sql) === "function") sql = sql(arg);
      if (typeof(sqlArg) === "function") sqlArg = sqlArg(arg);
      db.query(sql, sqlArg, next);
    };
  },
  send: function(res) {
    return function(arg, next) {
      res.send({result: arg});
      next(arg);
    };
  },
  useArray: function(res, errorMessage) {
    return function(arg, next) {
      if (!Array.isArray(arg)) {
        res.send({error: "bad query", message: errorMessage});
      } else {
        next(arg);
      }
    };
  },
  useOne: function(res, errorMessage) {
    return function(arg, next) {
      if (!Array.isArray(arg) || arg.length < 1) {
        res.send({error: "empty result", message: errorMessage});
      } else {
        next(arg[0]);
      }
    };
  },
  updateOne: function(res, errorMessage) {
    return function(arg, next) {
      if (!arg || arg.affectedRows !== 1) {
        res.send({error: "bad update", message: errorMessage});
      } else {
        next(arg);
      }
    };
  },
  changeOne: function(res, errorMessage) {
    return function(arg, next) {
      if (!arg || arg.changedRows !== 1) {
        res.send({error: "no change", message: errorMessage});
      } else {
        next(arg);
      }
    };
  }
};

module.exports.config = configure;
module.exports.database = db;
module.exports.async = async;
