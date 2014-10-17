'use strict';

var assign         = require('es5-ext/object/assign')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , callable       = require('es5-ext/object/valid-callable')
  , d              = require('d')
  , autoBind       = require('d/auto-bind')
  , Set            = require('observable-set/create-read-only')(
	require('observable-set/primitive')
)
  , serialize      = require('dbjs/_setup/serialize/object')

  , hasOwnProperty = Object.prototype.hasOwnProperty
  , create = Object.create, defineProperties = Object.defineProperties
  , Fragment;

module.exports = Fragment = function (fragment, filter) {
	var self;
	if (!(this instanceof Fragment)) throw new TypeError('Constructor requires \'new\'');
	callable(filter);
	self = setPrototypeOf(new Set(), Fragment.prototype);
	defineProperties(self, {
		__fragment__: d('', fragment),
		__filter__: d('', filter),
		__validated__: d('', create(null))
	});
	fragment.forEach(function (obj) { self._onUpdate(obj._lastOwnEvent_); });
	fragment.on('update', self._onUpdate);
	fragment.on('delete', self._onDelete);
	return self;
};
setPrototypeOf(Fragment, Set);

Fragment.prototype = create(Set.prototype, assign({
	constructor: d(Fragment)
}, autoBind({
	_serialize: d(serialize),
	_onUpdate: d(function (event) {
		var obj = event.object, id = obj.__id__;
		if (!hasOwnProperty.call(this.__validated__, id)) {
			if (!(this.__validated__[id] = Boolean(this.__filter__(obj)))) return;
		} else if (!this.__validated__[id]) {
			return;
		}
		this._add(obj);
		this.emit('update', event);
	}),
	_onDelete: d(function (valueId, id, event) {
		var obj = this.__setData__[id];
		if (!obj) return;
		this._delete(obj);
		this.emit('delete', valueId, id, event);
	})
})));
