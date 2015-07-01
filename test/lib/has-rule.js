'use strict';

module.exports = function (t, a) {
	a(t({}), false);
	a(t({ rule: 'foo' }), true);
};
