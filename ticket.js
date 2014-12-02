var fs = require("fs");
var path = require("path");
var common = require("./common.js");
var config = common.config;
var db = common.database;

module.exports.add = function(req, res) {
  var user = req.cookies["user"];
  var param = {
    starter: user.id,
    owner: req.body.owner,
    updatetime: new Date(),
    status: "assigned",
    jsoninfo: JSON.stringify({
      startername: user.jsoninfo.name || user.id,
      issuetime: new Date(),
      deadline: new Date(req.body.deadline),
      item: req.body.item,
      description: req.body.description 
    })
  };
  db.query("insert into `ticket` set ?", param, db.makeQueryHandler(res));
};

module.exports.edit = function(req, res) {
  var user = req.cookies["user"];
  db.query("select * from `ticket` where `id`=?", [req.body.id], function(error, result) {
    if (error) {
      res.send({error:JSON.stringify(error), message:"读取数据库发生错误。"});
    } else if (!result || !result[0]) {
      res.send({error:"ticket not exist", message:"要修改的报修单不存在。"});
    } else if (result[0].starter !== user.id && user.role !== "admin") {
      res.send({error:"unauthorized", message:"不能修改其他用户创建的报修单。"});
    } else {
      result[0].jsoninfo = JSON.parse(result[0].jsoninfo);
      result[0].jsoninfo.deadline = new Date(req.body.deadline);
      result[0].jsoninfo.item = req.body.item;
      result[0].jsoninfo.description = req.body.description;
      var param = {
        owner: req.body.owner,
        updatetime: new Date(),
        jsoninfo: JSON.stringify(result[0].jsoninfo)
      };
      db.query("update `ticket` set ? where `id`=?", [param, req.body.id], 
        db.makeQueryHandler(res, {}, undefined, 1, function() {
          var record = {
            ticket: req.body.id,
            updatetime: new Date(),
            jsoninfo: JSON.stringify({
              action: "edit",
              author: user.jsoninfo.name || user.id,
              user: user.id
            })
          };
          db.query("insert into `record` set ?", record, db.makeQueryHandler(res));
        }));
    }
  });
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
  db.query("select * from `ticket` where " + sqlcond + " order by updatetime desc limit ?,?", sqlarg, function(error, result) {
    var output = {};
    if (error) {
      output.error = JSON.stringify(error);
      output.message = "查询数据库发生了错误。";
    } else {
      result.forEach(function(t) {
        t.jsoninfo = JSON.parse(t.jsoninfo);
        t.updatetime = t.updatetime.toUTCString();
        t.jsoninfo.issuetime = new Date(t.jsoninfo.issuetime).toUTCString();
        t.jsoninfo.deadline = new Date(t.jsoninfo.deadline).toUTCString();
        t.editable = (t.starter === user.id || user.role === "admin");
      });
      output.tickets = result;
    }
    res.send(output);
  });
};

module.exports.count = function(req, res) {
  var sqlcond = "true";
  var sqlarg = [];
  Object.keys(req.body).forEach(function(key) {
    sqlcond = sqlcond + " and ??=?";
    sqlarg.push(key);
    sqlarg.push(req.body[key]);
  });
  db.query("select `status`, count(*) as `count` from `ticket` where " + sqlcond + " group by `status`", 
    sqlarg, function(error, result) {
    var output = {};
    if (error) {
      output.error = JSON.stringify(error);
      output.message = "查询数据库发生了错误。";
    } else {
      output.ticketCount = result;
    }
    res.send(output);
  });
};

module.exports.comment = function(req, res) {
  var user = req.cookies["user"];
  var file = req.files.file ? {
    originalname: req.files.file.originalname,
    name: req.files.file.name
  } : undefined;
  var record = {
    ticket: req.body.ticketid,
    updatetime: new Date(),
    jsoninfo: JSON.stringify({
      action: req.body.action,
      comment: req.body.comment,
      author: req.body.author,
      user: user.id,
      file: file
    })
  };
  db.query("select * from `ticket` where `id`=?", req.body.ticketid, function(error, result) {
    if (error) {
      res.send({error: JSON.stringify(error), message: "读取数据库发生错误。"});
      return;
    }
    if (!result || !result[0]) {
      res.send({error: "ticket not exist", message: "要操作的报修单不存在。"});
      return;
    } 
    var ticket = result[0];
    var actionMap = {
      complete: { assigned: true, changeStatus: "fixed" },
      cancel: { assigned: true, changeStatus: "closed" },
      reopen: { fixed: true, closed: true, changeStatus: "assigned" },
      comment: { assigned: true }
    };
    if (actionMap[req.body.action][ticket.status] !== true) {
      res.send({error: "bad status", message: "当前状态下无法进行这个操作。"})
      return;
    }
    var sql = "update `ticket` set updatetime=? where id=?";
    var sqlarg = [new Date(), ticket.id];
    if (actionMap[req.body.action].changeStatus !== undefined) {
      if (user.id !== ticket.starter && user.role !== "admin") {
        res.send({error: "unauthorized", message: "改变报修状态需要报修单的创建者进行操作。"});
        return;
      }
      sql = "update `ticket` set updatetime=?, status=? where id=?";
      sqlarg = [new Date(), actionMap[req.body.action].changeStatus, ticket.id];
    }
    db.query(sql, sqlarg, db.makeQueryHandler(res, {}, undefined, 1, function() {
      db.query("insert into `record` set ?", record, db.makeQueryHandler(res));
    }));
  });
};

module.exports.listComments = function(req, res) {
  var user = req.cookies["user"] || {};
  db.query("select * from `record` where `ticket`=? order by updatetime desc", [req.body.ticketid], function(error, result) {
    var output = {};
    if (error) {
      output.error = JSON.stringify(error);
      output.message = "查询数据库发生了错误。";
    } else {
      result.forEach(function(r) {
        r.jsoninfo = JSON.parse(r.jsoninfo);
        r.updatetime = r.updatetime.toUTCString();
        r.editable = (/*r.jsoninfo.user === user.id || */user.role === "admin");
      });
      output.comments = result;
    }
    res.send(output);
  });
};

module.exports.removeComment = function(req, res) {
  db.query("select * from `record` where `id`=?", [req.body.id], function(error, result) {
    if (error) {
      res.send({error: JSON.stringify(error), message: "读取数据库发生错误。"});
      return;
    } 
    if (!result || !result[0]) {
      res.send({error: "comment not exist", message: "要删除的记录不存在。"});
      return;
    }
    var record = result[0];
    record.jsoninfo = JSON.parse(record.jsoninfo);
    if (record.jsoninfo.file) {
      fs.unlink(path.join(__dirname, "public", "upload", record.jsoninfo.file.name), function(error) {
        if (error) {
          res.send({error: JSON.stringify(error), message: "无法删除附件文件。"});
        } else {
          db.query("delete from `record` where `id`=?", [req.body.id], db.makeQueryHandler(res));
        }
      });
    } else {
      db.query("delete from `record` where `id`=?", [req.body.id], db.makeQueryHandler(res));
    }
  });
};
