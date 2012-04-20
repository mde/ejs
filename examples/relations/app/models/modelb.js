var Modelb = function () {
  this.defineProperties({
    id: {type: 'string', required: true}
  });
  this.belongsTo('Modelc');
  this.adapter = 'Mongo';
};
Modelb = geddy.model.register('Modelb', Modelb);
