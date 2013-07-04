/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


var router = new geddy.RegExpRouter();

router.get('/').to('Main.index');
router.get('/community(.:format)').to('Main.community');
router.get('/documentation(.:format)').to('Main.documentation');
router.get('/reference(.:format)').to('Main.reference');
router.get('/guide(.:format)').to('Main.guide');
router.get('/tutorial(.:format)').to('Main.tutorial');
router.get('/faq(.:format)').to('Main.faq');
router.get('/changelog(.:format)').to('Main.changelog');

exports.router = router;
