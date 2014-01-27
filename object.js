// Representation of one object with its properties

'use strict';

var startsWith     = require('es5-ext/string/#/starts-with')
  , assign         = require('es5-ext/object/assign')
  , copy           = require('es5-ext/object/copy')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d/d')
  , autoBind       = require('d/auto-bind')
  , allOff         = require('event-emitter/lib/all-off')
  , Set            = require('observable-set/create-read-only')(
	require('observable-set/primitive')
)
  , serialize      = require('dbjs/_setup/serialize/object')

  , defineProperties = Object.defineProperties
  , Fragment, pass;

pass = function (rootObj, obj, sKey, rules) {
	var tree, current, deepPass, pass;
	if (rules['/'] === 2) deepPass = true;
	if (!obj.owner || (obj === rootObj)) {
		pass = rules[sKey];
		if (pass) return true;
		if (pass === 0) return false;
		if (deepPass) return true;
		return false;
	}
	tree = [sKey];
	do {
		tree.unshift(obj.__sKey__);
		obj = obj.owner;
	} while (obj.owner && (obj !== rootObj));
	current = tree.shift();
	while (true) {
		pass = rules[current];
		if (pass) {
			if (pass === 2) deepPass = true;
		} else {
			if (pass === 0) return false;
			if (!deepPass) return false;
		}
		sKey = tree.shift();
		if (!sKey) return true;
		current += '/' + sKey;
	}
};

module.exports = Fragment = function (obj, rules) {
	if (!(this instanceof Fragment)) return new Fragment(obj, rules);
	validValue(rules);
	Set.call(this);
	defineProperties(this, {
		__object__: d('', obj),
		__rules__: d('', rules)
	});
	if (obj._lastOwnEvent_) this.__setData__[obj.__id__] = obj;
	obj.master.on('update', this.onUpdate);
	this.onObject(obj);
};
setPrototypeOf(Fragment, Set);

Fragment.prototype = Object.create(Set.prototype, assign({
	_serialize: d(serialize),
	destroy: d(function () {
		var data;
		this.__object__.off('update', this.onUpdate);
		allOff(this);
		data = copy(this.__setData__);
		this._clear();
		return data;
	}),
	onObject: d(function (obj) {
		obj._forEachOwnDescriptor_(this.onDescriptor, this);
		obj._forEachOwnItem_(this.onItem, this);
		obj._forEachOwnNestedObject_(this.onObject, this);
	}),
	onDescriptor: d(function (desc) {
		var event;
		if (!pass(this.__object__, desc.object, desc._sKey_, this.__rules__)) {
			return;
		}
		event = desc._lastOwnEvent_;
		if (event && (event.value !== undefined)) {
			this.__setData__[desc.__id__] = desc;
		}
		desc._forEachOwnDescriptor_(this.onItem, this);
	}),
	onItem: d(function (obj) {
		var event;
		if (!pass(this.__object__, obj.object, obj._pSKey_, this.__rules__)) return;
		event = obj._lastOwnEvent_;
		if (!event) return;
		if (event.value === undefined) return;
		this.__setData__[obj.__id__] = obj;
	})
}, autoBind({
	onUpdate: d(function (event) {
		var obj = event.object, kind = obj._kind_;
		if (!startsWith.call(obj.__valueId__, this.__object__.__valueId__)) return;
		if (kind === 'descriptor') {
			if (!pass(this.__object__, obj.object, obj._sKey_, this.__rules__)) {
				return;
			}
		} else if (kind !== 'object') {
			if (!pass(this.__object__, obj.object, obj._pSKey_, this.__rules__)) {
				return;
			}
		}
		if (event.value === undefined) this._delete(obj);
		else this._add(obj);
		this.emit('update', event);
	})
})));
