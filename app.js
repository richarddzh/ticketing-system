var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var multer = require("multer");

var install = require("./install.js");
var login = require("./login.js");
var user = require("./user.js");
var ticket = require("./ticket.js");

var app = express();
var jsonParser = bodyParser.json();
var urlParser = bodyParser.urlencoded({extended: true});
var uploadParser = multer({dest: path.join(__dirname, "public/upload/")});

var contentType = function(typeString) {
  return function(req, res, next) {
    res.set("Content-Type", typeString);
    next();
  };
};

app.use(cookieParser());
app.use("/ticket-[0-9]+.html", express.static(path.join(__dirname, "public/ticket.html")));
app.use("/edit-ticket-[0-9]+.html", express.static(path.join(__dirname, "public/edit-ticket.html")));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/install.php", urlParser, install);
app.post("/api/login.php", urlParser, login.login);
app.post("/api/logout.php", login.logout);
app.post("/api/login-user.php", login.user);
app.post("/api/add-user.php", urlParser, login.require("id"), user.add);
app.post("/api/list-user.php", user.list);
app.post("/api/delete-user.php", urlParser, login.requireAdmin, user.remove);
app.post("/api/update-user.php", urlParser, login.require(), user.update);
app.post("/api/new-ticket.php", urlParser, login.require(), ticket.add);
app.post("/api/list-ticket.php", urlParser, ticket.list);
app.post("/api/count-ticket.php", urlParser, ticket.count);
app.post("/api/edit-ticket.php", urlParser, login.require(), ticket.edit);
app.post("/api/comment-ticket.php", uploadParser, login.require(), contentType("text/html"), ticket.comment);
app.post("/api/list-comment.php", urlParser, ticket.listComments);
app.post("/api/remove-comment.php", urlParser, login.requireAdmin, ticket.removeComment);
app.post("/api/remove-ticket.php", urlParser, login.requireAdmin, ticket.remove);

app.listen(5000);

module.exports = app;
