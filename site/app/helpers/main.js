

var tocNav = function (item) {
      var res = '';
      if (item.text) {
        res += '<li><a href="#' + item.name + '">' + item.text + '</a>\n';
      }
      if (item.children.length) {
        res += '<ul>\n'
        item.children.forEach(function (child) {
          res += tocNav(child);
        });
        res += '</ul>\n';
      }
      res += '</li>';
      return res;
    };

module.exports.tocNav = tocNav;
