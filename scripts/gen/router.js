var Router = require('geddy/lib/router').Router;

router = new Router();
router.match('/').to({controller: 'Main', action: 'index'});

// Basic routes
// router.match('/moving/pictures/:id').to(
//    {controller: 'Moving', action: 'pictures'});
// router.match('/farewells/:farewelltype/kings/:kingid').to(
//    {controller: 'Farewells', action: 'kings'});
// Can also match specific HTTP methods only
// router.match('/xandadu', 'get').to(
//    {controller: 'Xandadu', action: 'specialHandler'});
//
// Resource-based routes
// router.resource('hemispheres');

exports.router = router;

