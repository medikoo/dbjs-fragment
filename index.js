'use strict';

var assign         = require('es5-ext/object/assign')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , d              = require('d/d')
  , autoBind       = require('d/auto-bind')
  , MultiSet       = require('observable-multi-set/primitive')
  , serialize      = require('dbjs/_setup/serialize/object')

  , create = Object.create, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , baseSetAdd = MultiSet.prototype._onSetAdd
  , baseSetsClear = MultiSet.prototype._onSetsClear
  , baseSetDelete = MultiSet.prototype._onSetDelete
  , baseAdd = MultiSet.prototype._add
  , baseDelete = MultiSet.prototype._delete
  , Fragment;

module.exports = Fragment = function (object, rules) {
	if (!(this instanceof Fragment)) return new Fragment(object, rules);
	MultiSet.call(this, null, serialize);
	defineProperty(this, '__evented__', d('', create(null)));
};
setPrototypeOf(Fragment, MultiSet);

Fragment.prototype = Object.create(MultiSet.prototype, assign({
	_onSetAdd: d(function (fragment) {
		fragment.on('update', this.onUpdate);
		return baseSetAdd.call(this, fragment);
	}),
	_onSetsClear: d(function (fragments) {
		fragments.forEach(this._onSetDelete, this);
		baseSetsClear.call(this, fragments);
	}),
	_onSetDelete: d(function (fragment) {
		fragment.off('update', this.onUpdate);
		return baseSetDelete.call(this, fragment);
	}),
	_add: d(function (obj) {
		if (hasOwnProperty.call(this.__setData__, obj.__id__)) return this;
		baseAdd.call(this, obj);
		this.onUpdate(obj._lastOwnEvent_);
		return this;
	}),
	_delete: d(function (obj) {
		var event;
		if (!hasOwnProperty.call(this.__setData__, obj.__id__)) return false;
		baseDelete.call(this, obj);
		event = obj._lastOwnEvent_;
		if (event.value === undefined) return true;
		delete this.__evented__[event.index];
		this.emit('delete', obj.__valueId__, obj.__id__, event);
		return true;
	}),
	destroy: d(function () { this.sets.clear(); })
}, autoBind({
	onUpdate: d(function (event) {
		if (this.__evented__[event.index]) return;
		this.__evented__[event.index] = true;
		this.emit('update', event);
	})
})));
