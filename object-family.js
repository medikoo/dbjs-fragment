'use strict';

var assign         = require('es5-ext/object/assign-multiple')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d/d')
  , autoBind       = require('d/auto-bind')
  , memoize        = require('memoizee/lib/d')(require('memoizee/lib/regular'))
  , ObjectFragment = require('./object')
  , MultiSet       = require('./')
  , Rules          = require('./rules')

  , create = Object.create, defineProperties = Object.defineProperties
  , Driver, pass;

pass = function (obj, ident, rules) {
	var tree, current, deepPass, pass = rules['/'];
	if (pass && pass.$deep) deepPass = pass;
	if (!obj.__parent__) {
		pass = rules[ident];
		if (pass) return pass;
		if (pass === false) return false;
		if (deepPass) return deepPass;
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
			if (pass.$deep) deepPass = pass;
		} else {
			if (pass === false) return false;
			if (!deepPass) return false;
		}
		ident = tree.shift();
		if (!ident) return pass || deepPass;
		current += '/' + ident;
	}
};

Driver = function (mainFragment, obj, path, rules) {
	var fragment, assignments;
	defineProperties(this, {
		__main__: d('', mainFragment),
		__object__: d('', obj),
		__path__: d('', create(path)),
		__values__: d('', create(null)),
		__rules__: d('', rules),
		__fragment__: d('', fragment = new ObjectFragment(obj, rules.property))
	});
	this.__path__[obj.__id__] = true;
	mainFragment.sets.add(fragment);
	fragment.on('update', this.onUpdate);
	assignments = obj._assignments_;
	assignments.on('change', this.onAssignChange);
	fragment.forEach(function (obj) { this.onUpdate(obj._lastOwnEvent_); }, this);
	assignments._plainForEach_(this.onAssign, this);
};

defineProperties(Driver.prototype, assign({
	destroy: d(function () {
		this.__main__.sets.delete(this.__fragment__);
		this.__fragment__.off('update', this.onUpdate);
		this.__object__._assignments_.off('change', this.onAssignChange);
		this.extend.clearAll();
		this.__fragment__.destroy();
	}),
	onAssign: d(function (dbObj) {
		var rules, args, ident;
		if (this.__path__[dbObj.__master__.__id__]) return;
		rules = this.__rules__.assignment;
		if (!rules) return;
		if (dbObj._kind_ === 'descriptor') ident = dbObj._ident_;
		else ident = dbObj._pIdent_;
		rules = pass(dbObj.__object__, ident, rules);
		if (!rules) return;
		args = [dbObj.__master__, rules.property, rules.value, rules.assignment];
		this.__values__[dbObj.__id__] = { args: args };
		this.extend.apply(this, args);
	}),
	onDismiss: d(function (dbObj) {
		var data = this.__values__[dbObj.__id__];
		if (!data) return;
		this.extend.clearRef.apply(this, data.args);
		delete this.__values__[dbObj.__id__];
	})
}, memoize({
	extend: d(function (object, rProperty, rValue, rAssignment) {
		return new Driver(this.__main__, object, this.__path__,
			{ property: rProperty, value: rValue, assignment: rAssignment });
	}, { refCounter: true, dispose: function (driver) { driver.destroy(); } })
}), autoBind({
	onUpdate: d(function (event) {
		var dbObj = event.object, kind = dbObj._kind_, old, value, rules, args
		  , removed, ident;
		if (kind === 'object') return;
		if (kind === 'sub-descriptor') return;
		if (kind === 'descriptor') {
			value = event.value;
			ident = dbObj._ident_;
		} else {
			removed = !event.value;
			value = dbObj._key_;
			ident = dbObj._pIdent_;
		}
		old = this.__values__[dbObj.__id__];
		if (old) {
			if (!removed && (value === old.object)) return;
			this.extend.clearRef.apply(this, old.args);
			delete this.__values__[dbObj.__id__];
		}
		if (removed) return;
		if (!value || !value.__id__ || (value._kind_ !== 'object')) return;
		if (this.__path__[value.__master__.__id__]) return;
		rules = this.__rules__.value;
		if (!rules) return;
		rules = pass(dbObj.__object__, ident, rules);
		if (!rules) return;
		args = [value.__master__, rules.property, rules.value, rules.assignment];
		this.__values__[dbObj.__id__] = { object: value, args: args };
		this.extend.apply(this, args);
	}),
	onAssignChange: d(function (event) {
		if (event.type === 'add') {
			this.onAssign(event.value);
			return;
		}
		if (event.type === 'delete') {
			this.onDismiss(event.value);
			return;
		}
		if (event.type === 'batch') {
			if (this.added) this.added.forEach(this.onAssign, this);
			if (this.deleted) this.deleted.forEach(this.onDismiss, this);
			return;
		}
		// Must not happen, throw for awareness
		throw new TypeError("Unrecognized event");
	})
})));

module.exports = function (obj/*, rules*/) {
	var fragment = new MultiSet(), rules = arguments[1];
	if (rules === undefined) rules = new Rules();
	else validValue(rules);
	new Driver(fragment, obj, null, rules); //jslint: skip
	return fragment;
};
