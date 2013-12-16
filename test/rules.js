'use strict';

module.exports = function (T, a) {
	var rules = new T(), x;

	a.deep(rules.property, { '/': 2 }, "Property");
	a(rules.value['/'] instanceof T, true, "Value");
	a(rules.assignment['/'] instanceof T, true, "Assignment");
	x = rules.value = {};
	a(rules.value, x, "Editable");
};
