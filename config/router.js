var Router = require('../framework/router').Router;

router = new Router();
router.match('/').to({controller: 'Main', action: 'index'});
router.match('/users/:userid/messages/:messageid').to({controller: 'Users', action: 'index'});

exports.router = router;
