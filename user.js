var common = require("./common.js");
var async = common.async;

module.exports.add = function(req, res) {
  if (req.body.action === "insert") {
    delete req.body.action;
    async.concat([
      async.query("insert into `user` set ?", req.body),
      async.updateOne(res, "该用户名可能已经存在，请尝试更换用户名。"),
      async.send(res)
      ]);
  } else if (req.body.action === "update") {
    delete req.body.action;
    var user = req.cookies["user"];
    if ((user === undefined || user.role !== "admin") && req.body.role === "admin") {
      res.send({error: "unauthorized", message: "用户不能给自己提升权限。"});
      return;
    }
    async.concat([
      async.query("update `user` set ? where `id`=?", [req.body, req.body.id]),
      async.updateOne(res, "该用户可能不存在，请尝试更换用户名。"),
      async.send(res)
      ]);
  } else {
    res.send({error: "unknown action", message: "必须指定新增或者更新用户操作。"});
  }
};

module.exports.list = function(req, res) {
  async.concat([
    async.query("select `id`,`role`,`name` from `user`"),
    async.useArray(res),
    function(users) {
      res.send({
        users: users,
        loginUser: req.cookies["user"] || {}
      });
    }
    ]);
};

module.exports.remove = function(req, res) {
  var user = req.cookies["user"];
  if (user && user.id === req.body.id) {
    res.send({error: "unauthorized", message: "用户不能删除自己。"});
    return;
  }
  async.concat([
    async.query("delete from `user` where `id`=?", [req.body.id]),
    async.updateOne(res, "该用户可能不存在。"),
    async.send(res)
    ]);
};

module.exports.update = function(req, res) {
  var user = req.cookies["user"] || {};
  if (req.body.action === "update-name") {
    async.concat([
      async.query("update `user` set `name`=? where `id`=?", [req.body.name, user.id]),
      async.updateOne(res, "该用户可能不存在。"),
      function(result) {
        user.name = req.body.name;
        res.cookie("user", user);
        res.send({result: result});
      }
      ]);
  } else if (req.body.action === "change-password") {
    async.concat([
      async.query("update `user` set `password`=? where `id`=? and `password`=?", 
        [req.body.newpassword, user.id, req.body.oldpassword]),
      async.updateOne(res, "请确定输入的旧密码是正确的。"),
      async.send(res)
      ]);
  } else {
    res.send({error: "unknown action", message: "该请求没有指定操作类型。"});
  }
};
