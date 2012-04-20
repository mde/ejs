var Modela = function () {
  this.defineProperties({
    id: {type: 'string', required: true}
  });
  this.hasMany('Modelb');
  this.adapter = "Mongo";
};
Modela = geddy.model.register('Modela', Modela);

