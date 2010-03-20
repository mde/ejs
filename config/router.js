var Router = require('../framework/router').Router;

router = new Router();
router.match('/').to({controller: 'Main', action: 'index'});
router.resource('users');

exports.router = router;
