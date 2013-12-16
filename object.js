// Representation of one object with its properties

'use strict';

var assign         = require('es5-ext/object/assign')
  , copy           = require('es5-ext/object/copy')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d/d')
  , autoBind       = require('d/auto-bind')
  , allOff         = require('event-emitter/lib/all-off')
  , Set            = require('observable-set/create-read-only')(
	require('observable-set/primitive')
)
  , serialize      = require('dbjs/_setup/utils/serialize')

  , defineProperties = Object.defineProperties
  , Fragment, pass;

pass  = function (obj, ident, rules) {
	var tree, current, deepPass, pass;
	if (rules['/'] === 2) deepPass = true;
	if (!obj.__parent__) {
		pass = rules[ident];
		if (pass) return true;
		if (pass === 0) return false;
		if (deepPass) return true;
		return false;
	}
	tree = [ident];
	do {
		tree.unshift(obj.__ident__);
		obj = obj.__parent__;
	} while (obj.__parent__);
	current = tree.shift();
	while (true) {
		pass = rules[current];
		if (pass) {
			if (pass === 2) deepPass = true;
		} else {
			if (pass === 0) return false;
			if (!deepPass) return false;
		}
		ident = tree.shift();
		if (!ident) return true;
		current += '/' + ident;
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
	obj.on('update', this.onUpdate);
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
		if (!pass(desc.__object__, desc._ident_, this.__rules__)) return;
		event = desc._lastOwnEvent_;
		if (event && (event.value !== undefined)) {
			this.__setData__[desc.__id__] = desc;
		}
		desc._forEachOwnDescriptor_(this.onItem, this);
	}),
	onItem: d(function (obj) {
		var event;
		if (!pass(obj.__object__, obj._pIdent_, this.__rules__)) return;
		event = obj._lastOwnEvent_;
		if (!event) return;
		if (event.value === undefined) return;
		this.__setData__[obj.__id__] = obj;
	})
}, autoBind({
	onUpdate: d(function (event) {
		var obj = event.object, kind = obj._kind_;
		if (kind === 'descriptor') {
			if (!pass(obj.__object__, obj._ident_, this.__rules__)) return;
		} else if (kind !== 'object') {
			if (!pass(obj.__object__, obj._pIdent_, this.__rules__)) return;
		}
		if (event.value === undefined) this._delete(obj);
		else this._add(obj);
		this.emit('update', event);
	})
})));
