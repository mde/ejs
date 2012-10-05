var Box = function () {

  this.defineProperties({
    id: {type: 'string', required: true}
  });

  this.hasMany('Things');

  this.adapter = 'mongo';

};
Box = geddy.model.register('Box', Box);
