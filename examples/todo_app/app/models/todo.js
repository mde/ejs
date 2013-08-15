
var Todo = function () {

  this.defineProperties({
    title: {type: 'string', required: true}
  , status: {type: 'string', required: true}
  });

  this.validatesPresent('title');
  this.validatesLength('title', {min: 5});

  this.validatesWithFunction('status', function (status) {
    return status == 'open' || status == 'done';
  });

};

exports.Todo = Todo;

