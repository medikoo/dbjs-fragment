'use strict';

var assign = require('es5-ext/object/assign')
  , d      = require('d')
  , lazy   = require('d/lazy')

  , Rules = module.exports = function () {};

Object.defineProperties(Rules.prototype, assign({
	$deep: d(true)
}, lazy({
	property: d(function () { return { '/': 2 }; }, { desc: 'cew' }),
	value: d(function () { return { '/': new Rules() }; }, { desc: 'cew' }),
	assignment: d(function () { return { '/': new Rules() }; }, { desc: 'cew' })
})));
