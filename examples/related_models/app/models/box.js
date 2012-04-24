var Box = function () {

  this.defineProperties({
    id: {type: 'string', required: true}
  });

  this.hasMany('Things');

  this.adapter = 'Mongo';

};
Box = geddy.model.register('Box', Box);
