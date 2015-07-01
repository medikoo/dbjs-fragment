'use strict';

module.exports = function (rules) {
	if (!rules.children) return;
	if (!rules.children['*']) return rules.children[this];
	if (!rules.children[this]) return rules.children['*'];
	return [rules.children[this], rules.children['*']];
};
