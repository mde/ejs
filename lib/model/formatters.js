
var formatters = new function () {
  this.date = function (val) {
    return geddy.date.strftime(val, geddy.config.dateFormat);
  };

  this.time = function (val) {
    return geddy.date.strftime(val, geddy.config.timeFormat);
  };

}();

module.exports = formatters;
