var common = require("./common.js");
var config = common.config;
var db = common.database;

var makeQueryHandler = db.makeQueryHandler;

module.exports.add = function(req, res) {
  var output = {};
  if (req.body.action === "insert") {
    delete req.body.action;
    req.body.jsoninfo = "{}";
    db.query("insert into `user` set ?", req.body, 
      makeQueryHandler(res, output, "数据库更新失败，该用户名可能已经存在。"));
  } else if (req.body.action === "update") {
    delete req.body.action;
    var user = req.cookies["user"];
    if ((user === undefined || user.role !== "admin") && req.body.role === "admin") {
      output.error = "unauthorized";
      output.message = "用户不能给自己提升权限。";
      res.send(output);
      return;
    }
    db.query("update `user` set ? where `id`=?", [req.body, req.body.id],
      makeQueryHandler(res, output, "数据库更新失败，该用户可能不存在。"));
  } else {
    output.error = "unknown action";
    output.message = "必须指定新增或者更新用户操作。"
    res.send(output);
  }
};

module.exports.list = function(req, res) {
  var output = {};
  db.query("select `id`,`role`,`jsoninfo` from `user`", function(error, result) {
    if (error) {
      output.error = JSON.stringify(error);
      output.message = "无法读取数据库。";
    } else {
      result.forEach(function(u) {
        u.jsoninfo = JSON.parse(u.jsoninfo);
      });
      output.users = result;
    }
    res.send(output);
  });
};

module.exports.remove = function(req, res) {
  var output = {};
  var user = req.cookies["user"];
  if (user && user.id === req.body.id) {
    output.error = "unauthorized";
    output.message = "用户不能删除自己。";
    res.send(output);
    return;
  }
  db.query("delete from `user` where `id`=?", [req.body.id], 
    makeQueryHandler(res, output, "数据库更新失败，该用户可能不存在。"));
};

module.exports.update = function(req, res) {
  var output = {};
  var user = req.cookies["user"];
  if (!user || !user.jsoninfo || !user.id) {
    output.error = "bad session data";
    output.message = "用户信息不完整，请重新登录再试。";
    res.send(output);
    return;
  }
  if (req.body.action === "update-name") {
    user.jsoninfo.name = req.body.name;
    db.query("update `user` set `jsoninfo`=? where `id`=?", 
      [JSON.stringify(user.jsoninfo), user.id], 
      makeQueryHandler(res, output, "数据库更新失败，该用户可能不存在。"));
    res.cookie("user", user);
  } else if (req.body.action === "change-password") {
    db.query("update `user` set `password`=? where `id`=? and `password`=?", 
      [req.body.newpassword, user.id, req.body.oldpassword], 
      makeQueryHandler(res, output, "数据库更新失败，请确定输入的旧密码是正确的。"));
  } else {
    output.error = "unknown action";
    output.message = "该请求没有指定操作类型。"
    res.send(output);
  }
};