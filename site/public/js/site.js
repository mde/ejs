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
    this.registerScroll();
    this.registerMenu();
  };

  // register the collapsible menu
  this.registerMenu = function() {
    var self = this;
    this.$toc.find('ul > li').click(function(e) {
      var $el = $(this);
      var $section = $el.find('a:first');
      var $subList = $el.find('ul');
      if ($section.hasClass('selected') && !$el.siblings('ul').legnth) {
        $section.removeClass('selected');
        $subList.removeClass('selected');
        self.noScroll = false;
      }
      else {
        self.$toc.find('.selected').removeClass('selected');
        $subList.addClass('selected');
        $section.addClass('selected');
        if (self.$toc.height() > $(window).height()) {
          var time = setTimeout(function() {
            self.noScroll = true;
            clearTimeout(time);
          }, 10);
        }
     }
    });
  };

  // register the scrolling menu
  this.registerScroll = function() {
    var self = this;
    $(window).scroll(function(e) {

      if (self.noScroll) {
        return;
      }

      var newTop = $(this).scrollTop();
      // only scroll on screens larger than an iphone
      if (newTop > 462 && $(this).width() > 767) {
        self.$toc.offset({top: newTop + 20});
      } else {
        self.$toc.css({'top': 0, 'position': 'static'});
      }
    });
  };

})();

// wait for document to load
// then init this page
$(document).ready(function () {
  if (app.state.page == 'guide' ||
      app.state.page == 'reference' ||
      app.state.page == 'tutorial' ||
      app.state.page == 'changelog') {
    app.docs.init();
  }
});

// Start shit up
app.init();
