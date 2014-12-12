var common = require("./common.js");
var async = common.async;

module.exports.range = function(req, res) {
  var sql = "select count(distinct `record`.`ticket`) as `count`, "
    + "`record`.`action` as `action`, `ticket`.`starter` as `starter` "
    + "from `record`, `ticket` where `record`.`ticket`=`ticket`.`id` "
    + "and `record`.`updatetime`>=? and `record`.`updatetime` < ? " 
    + "group by `record`.`action`, `ticket`.`starter`";
  async.concat([
    async.query(sql, [req.body.begin, req.body.end]),
    async.useArray(res, "无法进行时间区间统计。"),
    async.send(res)
    ]);
};
