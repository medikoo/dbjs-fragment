'use strict';

var forEach = require('es5-ext/object/for-each')
  , memoize = require('memoizee/weak')
  , create  = Object.create;

module.exports = memoize(function (rules) {
	var map = {};

	forEach(rules, function (rule, key) {
		var currentMap = map, tokens, token;
		if (key === '/') {
			map.rule = rule;
			return;
		}
		tokens = key.split('/');
		while ((token = tokens.shift())) {
			if (!currentMap.children) currentMap.children = create(null);
			if (!currentMap.children[token]) currentMap.children[token] = {};
			currentMap = currentMap.children[token];
		}
		currentMap.rule = rule;
	});
	return map;
});
