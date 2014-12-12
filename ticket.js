var fs = require("fs");
var path = require("path");
var common = require("./common.js");
var async = common.async;

module.exports.add = function(req, res) {
  var user = req.cookies["user"] || {};
  var param = {
    starter: user.id,
    startername: user.name,
    owner: req.body.owner,
    status: "assigned",
    deadline: new Date(req.body.deadline),
    item: req.body.item,
    detail: req.body.detail 
  };
  async.concat([
    async.query("insert into `ticket` set ?", param),
    async.updateOne(res, "无法插入新的报修单。"),
    async.send(res),
    async.query("insert into `record` set ?", function(result) {
      return {
        ticket: result.insertId,
        action: "create",
        user: user.id,
        author: user.name
      };
    })
    ]);
};

module.exports.edit = function(req, res) {
  var user = req.cookies["user"];
  var param = {
    item: req.body.item,
    detail: req.body.detail,
    owner: req.body.owner,
    deadline: new Date(req.body.deadline)
  };
  async.concat([
    async.query("update `ticket` set ? where `id`=?", [param, req.body.id]),
    async.updateOne(res, "无法插入新的报修单。"),
    async.send(res),
    async.query("insert into `record` set ?", {
      ticket: req.body.id,
      action: "edit",
      user: user.id,
      author: user.name})
    ]);
};

module.exports.list = function(req, res) {
  var user = req.cookies["user"] || {};
  var page = parseInt(req.body.page || "1", 10);
  var pagesize = parseInt(req.body.pagesize || "10", 10);
  var sqlcond = "true";
  var sqlarg = [];
  delete req.body.page;
  delete req.body.pagesize;
  Object.keys(req.body).forEach(function(key) {
    sqlcond = sqlcond + " and ??=?";
    sqlarg.push(key);
    sqlarg.push(req.body[key]);
  });
  sqlarg.push((page - 1) * pagesize);
  sqlarg.push(pagesize);
  async.concat([
    async.query("select * from `ticket` where " + sqlcond + " order by updatetime desc limit ?,?", sqlarg),
    async.useArray(res, "查询报修单失败。"),
    function(result) {
      result.forEach(function(t) {
        t.updatetime = t.updatetime.toUTCString();
        t.issuetime = t.issuetime.toUTCString();
        t.deadline = t.deadline.toUTCString();
        t.editable = (t.starter === user.id || user.role === "admin");
        t.removable = (user.role === "admin");
      });
      res.send({tickets: result});
    }
    ]);
};

module.exports.count = function(req, res) {
  var sqlcond = "true";
  var sqlarg = [];
  Object.keys(req.body).forEach(function(key) {
    sqlcond = sqlcond + " and ??=?";
    sqlarg.push(key);
    sqlarg.push(req.body[key]);
  });
  async.concat([
    async.query("select `status`, count(*) as `count` from `ticket` where " + sqlcond + " group by `status`", sqlarg),
    async.useArray(res, "查询报修单数量失败。"),
    async.send(res)
    ]);
};

var actionMap = {
  complete: { assigned: true, changeStatus: "fixed" },
  cancel: { assigned: true, changeStatus: "closed" },
  reopen: { fixed: true, closed: true, changeStatus: "assigned" },
  comment: { assigned: true }
};

module.exports.comment = function(req, res) {
  var user = req.cookies["user"];
  var file = req.files.file ? {
    originalname: req.files.file.originalname,
    name: req.files.file.name
  } : undefined;
  var record = {
    ticket: req.body.ticketid,
    action: req.body.action,
    user: user.id,
    author: req.body.author || "",
    comment: req.body.comment || "",
    jsoninfo: JSON.stringify({file: file})
  };
  async.concat([
    async.query("select * from `ticket` where `id`=?", req.body.ticketid),
    async.useOne(res, "要操作的报修单不存在。"),
    function(ticket, next) {
      if (actionMap[req.body.action][ticket.status] !== true) {
        res.send({error: "bad status", message: "当前状态下无法进行这个操作。"});
        return;
      }
      var sql = "update `ticket` set updatetime=? where id=?";
      var sqlarg = [new Date(), ticket.id];
      if (actionMap[req.body.action].changeStatus !== undefined) {
        if (user.id !== ticket.starter && user.role !== "admin") {
          res.send({error: "unauthorized", message: "改变报修状态需要报修单的创建者进行操作。"});
          return;
        }
        sql = "update `ticket` set status=? where id=?";
        sqlarg = [actionMap[req.body.action].changeStatus, ticket.id];
      }
      next({sql: sql, sqlarg: sqlarg});
    },
    async.query(function(param) { return param.sql; }, function(param) { return param.sqlarg; }),
    async.changeOne(res, "无法更新报修单状态。"),
    async.query("insert into `record` set ?", record),
    async.updateOne(res, "无法插入新的历史记录。"),
    async.send(res)
    ]);
};

module.exports.listComments = function(req, res) {
  var user = req.cookies["user"] || {};
  async.concat([
    async.query("select * from `record` where `ticket`=? order by updatetime desc", [req.body.ticketid]),
    async.useArray(res, "查询历史记录失败。"),
    function(result) {
      result.forEach(function(r) {
        r.jsoninfo = JSON.parse(r.jsoninfo);
        r.updatetime = r.updatetime.toUTCString();
        r.editable = (user.role === "admin");
      });
      res.send({comments: result});
    }
    ]);
};

module.exports.removeComment = function(req, res) {
  async.concat([
    async.query("select * from `record` where `id`=?", [req.body.id]),
    async.useOne(res, "要删除的历史记录不存在。"),
    function(record, next) {
      record.jsoninfo = JSON.parse(record.jsoninfo);
      if (record.jsoninfo && record.jsoninfo.file) {
        fs.unlink(path.join(__dirname, "public", "upload", record.jsoninfo.file.name), function(error) {
          if (error) {
            res.send({error: JSON.stringify(error), message: "无法删除附件文件。"});
          } else {
            next();
          }
        });
      } else {
        next();
      }
    },
    async.query("delete from `record` where `id`=?", [req.body.id]),
    async.updateOne(res, "无法删除历史记录。"),
    async.send(res)
    ]);
};

module.exports.remove = function(req, res) {
  async.concat([
    async.query("select count(*) as `count` from `record` where `ticket`=?", [req.body.ticketid]),
    async.useOne(res, "无法获取相关历史记录的数量。"),
    function(result, next) {
      if (result.count !== 0) {
        res.send({error: "bad action", message: "请先删除此报修单的所有历史记录。"});
      } else {
        next();
      }
    },
    async.query("delete from `ticket` where `id`=?", [req.body.ticketid]),
    async.updateOne(res, "无法删除报修单。"),
    async.send(res)
    ]);
};
