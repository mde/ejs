var app = {}
// set up some state
app.init = function () {
  app.state = {};
  app.state.location = window.location;
  app.state.page = app.state.location.pathname.replace('/','');
};

app.docs = new (function() {

  this.init = function() {
    this.$toc = $('.toc');
    this.$content = $('content .span8');
    this.giveSubIDs();
    this.registerScroll();
    this.registerMenu();
  };

  // register the collapsible menu
  this.registerMenu = function() {
    var self = this;
    this.$toc.find('ul > li').click(function(e) {
      var $el = $(this);
      self.$toc.find('.selected').removeClass('selected');
      $el.find('ul').addClass('selected');
      $el.find('a:first').addClass('selected');
    });
  };

  // register the scrolling menu
  this.registerScroll = function() {
    var self = this;
    $(window).scroll(function(e) {
      var newTop = $(this).scrollTop();
      // only scroll on screens larger than an iphone
      if (newTop > 462 && $(this).width() > 767) {
        self.$toc.offset({top: newTop + 20});
      } else {
        self.$toc.css({'top': 0, 'position': 'static'});
      }
    });
  };

  // make internal anchor links work for sub menu items
  this.giveSubIDs = function() {
    var section;
    $('.content .span6').children('h3, h4').each(function (i, el) {
      var $el = $(el);
      if (el.nodeName == "H3") {
        section = $el.attr('id');
      } else {
        $el.attr('id', section + $el.text());
      }
    });
  };

})();

// wait for document to load
// then init this page
$(document).ready(function () {
  if (app.state.page == 'documentation' ||
      app.state.page == 'tutorial' ||
      app.state.page == 'changelog') {
    app.docs.init();
  }
});

// Start shit up
app.init();
