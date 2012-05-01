var Widget = function () {

  this.defineProperties({
    id: {type: 'string', required: true}
  });

  this.hasOne('Thing');

  this.adapter = 'Mongo';

};
Widget = geddy.model.register('Widget', Widget);
