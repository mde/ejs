
var auth = new function () {
  this.requireAuth = function () {

  };
  hooks.registerHook('requireAuth', {func: this.requireAuth});
}();
