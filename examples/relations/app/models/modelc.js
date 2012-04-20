var Modelc = function () {
  this.defineProperties({
    id: {type: 'string', required: true}
  });
  this.belongsTo('Modela');
  this.adapter = 'Mongo';
};
Modelc = geddy.model.register('Modelc', Modelc);
