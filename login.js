var common = require("./common.js");
var async = common.async;

module.exports.login = function(req, res) {
  res.clearCookie("user");
  async.concat([
    async.query("select * from `user` where `id`=? and `password`=?", [req.body.username, req.body.password]),
    async.useOne(res, "登录失败，无法查询到匹配的用户。"),
    function(user) {
      user.password = "";
      res.cookie("user", user);
      res.send({user: user});
    }
    ]);
};

module.exports.logout = function(req, res) {
  res.clearCookie("user");
  res.send({});
};

module.exports.user = function(req, res) {
  res.send({user: req.cookies["user"]});
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
