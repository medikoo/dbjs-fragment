'use strict';

module.exports = function (t, a) {
	var direct = {}, dynamic = {};
	a(t.call('foo', {}), undefined);
	a(t.call('foo', { children: {} }), undefined);
	a(t.call('foo', { children: { '*': dynamic } }), dynamic);
	a(t.call('foo', { children: { foo: direct } }), direct);
	a.deep(t.call('foo', { children: { '*': dynamic, foo: direct } }), [direct, dynamic]);
};
