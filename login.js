var common = require("./common.js");
var config = common.config;
var db = common.database;

module.exports.login = function(req, res) {
  res.clearCookie("user");
  db.query("select * from `user` where `id`=? and `password`=?", 
    [req.body.username, req.body.password], function(err, result) {
    var output = {};
    output.alert = true;
    if (err) res.error = err;
    else if (result && result.length === 1) {
      output.user = result[0];
      output.user.password = "";
      output.user.jsoninfo = JSON.parse(output.user.jsoninfo);
      res.cookie("user", output.user);
    }
    res.send(output);
  });
};

module.exports.logout = function(req, res) {
  res.clearCookie("user");
  res.send({});
};

module.exports.user = function(req, res) {
  var output = {};
  output.user = req.cookies["user"];
  res.send(output);
};

module.exports.require = function(uidField) {
  return function(req, res, next) {
    var user = req.cookies["user"];
    if (user === undefined || (user.role !== "admin" && uidField !== undefined && user.id !== req.body[uidField])) {
      var output = {};
      output.error = "unauthorized";
      output.message = "这个操作需要用户登录且具有权限。";
      res.send(output);
    } else {
      next();
    }
  };
};

module.exports.requireAdmin = function(req, res, next) {
  var user = req.cookies["user"];
  if (user === undefined || user.role !== "admin") {
    var output = {};
    output.error = "unauthorized";
    output.message = "这个操作需要用户登录且具有权限。";
    res.send(output);
  } else {
    next();
  }
};
