
var Todo = function () {
  this.property('title', 'string', {required: true});
  this.property('status', 'string', {required: true, default: 'open'});
  this.property('id', 'string', {required: true, })

  this.validatesPresent('title');
  this.validatesLength('title', {min: 5});

  this.validatesWithFunction('status', function (status) {
    return status == 'open' || status == 'done';
  });

  this.finish = function() {
    this.status = 'done';
  }

};

Todo = geddy.model.register('Todo', Todo);

