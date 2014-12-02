if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function forEach( callback, thisArg ) {
    var T, k;
    if ( this == null ) {
      throw new TypeError( "this is null or not defined" );
    }
    var O = Object(this);
    var len = O.length >>> 0; // Hack to convert O.length to a UInt32
    if ( {}.toString.call(callback) !== "[object Function]" ) {
      throw new TypeError( callback + " is not a function" );
    }
    if ( thisArg ) {
      T = thisArg;
    }
    k = 0;
    while( k < len ) {
      var kValue;
      if ( Object.prototype.hasOwnProperty.call(O, k) ) {
        kValue = O[ k ];
        callback.call( T, kValue, k, O );
      }
      k++;
    }
  };
}

jQuery(function($) {
  var handler = function(event) {
    var that = $(this);
    var callback = that.attr("data-target");
    $.ajax({
      type: that.attr("method"),
      url: that.attr("action"),
      data: that.serialize(),
      success: function(data, status) {
        if (typeof(data) === "string") {
          data = JSON.parse(data);
        }
        window[callback](data);
      }
    });
    event.preventDefault();
    return false;
  };
  $("form[data-async]").live("submit", handler);
  $("a[data-async]").live("click", handler);
  $("a[js-caller]").live("click", function(event) {
    var that = $(this);
    var callback = that.attr("js-function");
    var arg = that.attr("js-arg");
    window[callback](arg);
    event.preventDefault();
    return false;
  });
});

jQuery.validator.addMethod("identifier", function(value, element) {
  return this.optional(element) || /^[A-Za-z]+[A-Za-z0-9_]*$/.test(value);
}, "Please specify a valid identifier.");

jQuery.validator.addMethod("timestamp", function(value, element) {
  var valid = this.optional(element);
  var re = /^[0-9]{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01]) (0?[1-9]|1[0-9]|2[0-4]):[0-9]{2}$/;
  if (valid) return valid;
  return re.test(value);
}, "Please specify a valid timestamp with format 'yyyy-M-d h:m'.");

function format_date(d, fmt) {
  if (typeof d === "string") {
    d = new Date(d);
  }
  if (fmt === undefined) {
    fmt = "M月d日 hh时mm分";
  }
  var o = {
    "M+": d.getMonth() + 1, //月份 
    "d+": d.getDate(), //日 
    "h+": d.getHours(), //小时 
    "m+": d.getMinutes(), //分 
    "s+": d.getSeconds(), //秒 
    "q+": Math.floor((d.getMonth() + 3) / 3), //季度 
    "S": d.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) 
      fmt = fmt.replace(
        RegExp.$1, 
        (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))
      );
  }
  return fmt;
}

function render_ticket(ticket, dateformat) {
  var elem = $("#ticket-demo").clone();
  elem.find("#data-starter").text(ticket.jsoninfo.startername);
  elem.find("#data-item").text(ticket.jsoninfo.item);
  elem.find("#data-detail").text(ticket.jsoninfo.description);
  elem.find("#data-issuetime").text(format_date(ticket.jsoninfo.issuetime, dateformat));
  elem.find("#data-owner").text(ticket.owner);
  elem.find("#data-updatetime").text(format_date(ticket.updatetime, dateformat));
  elem.find("#data-deadline").text(format_date(ticket.jsoninfo.deadline, dateformat));
  elem.find("#data-link").attr("href", "ticket-" + ticket.id + ".html");
  elem.find("#data-edit-link").attr("href", "edit-ticket-" + ticket.id + ".html");
  elem.attr("id", "ticket-" + ticket.id);
  var status = ticket.status;
  if (status === "assigned" && new Date(ticket.jsoninfo.deadline) < new Date()) {
    status = "overdue";
  }
  var attr = {
    "assigned": {btn:"btn-warning", icon:"icon-wrench", msg:"待维修"},
    "fixed": {btn:"btn-success", icon:"icon-check", msg:"已修复"},
    "closed": {btn:"", icon:"icon-trash", msg:"已取消"},
    "overdue": {btn:"btn-danger", icon:"icon-exclamation-sign", msg:"已过期"}
  };
  elem.find(".btn").attr("class", "btn pull-left " + attr[status].btn);
  elem.find(".btn i").attr("class", attr[status].icon);
  elem.find(".btn span.status").text(attr[status].msg);
  return elem;
}

if (!window.console) {
  window.console = {
    log: function(message) { alert(message); }
  };
}
