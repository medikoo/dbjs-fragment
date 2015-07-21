'use strict';

var find           = require('es5-ext/array/#/find')
  , flatten        = require('es5-ext/array/#/flatten')
  , assign         = require('es5-ext/object/assign')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d')
  , autoBind       = require('d/auto-bind')
  , memoizeMethods = require('memoizee/methods')
  , getNormalizer  = require('memoizee/normalizers/get-fixed')
  , ObjectFragment = require('./object')
  , MultiSet       = require('./')
  , Rules          = require('./rules')
  , mapRules       = require('./lib/map-rules')
  , hasRule        = require('./lib/has-rule')
  , resolveRules   = require('./lib/resolve-rules')

  , isArray = Array.isArray, create = Object.create, defineProperties = Object.defineProperties
  , Driver, pass;

require('memoizee/ext/dispose');
require('memoizee/ext/ref-counter');

pass = function (rootObj, obj, sKey, rules) {
	var tree, current, deepPass = false, pass, rule;
	rules = mapRules(rules);
	pass = rules.rule;
	if (pass && pass.$deep) deepPass = pass;
	if (!obj.owner || (obj === rootObj)) {
		pass = rules.children && rules.children[sKey] && rules.children[sKey].rule;
		if (pass == null) {
			pass = rules.children && rules.children['*'] && rules.children['*'].rule;
		}
		if (pass) return pass;
		if (pass === false) return false;
		if (deepPass) return deepPass;
		return false;
	}
	if (!rules.children) return deepPass;
	tree = [sKey];
	do {
		tree.unshift(obj.__sKey__);
		obj = obj.owner;
	} while (obj.owner && (obj !== rootObj));
	current = tree.shift();
	rules = resolveRules.call(current, rules);
	if (!rules) return deepPass;
	while (true) {
		if (isArray(rules)) {
			rule = find.call(rules, hasRule);
			pass = rule && rule.rule;
		} else {
			pass = rules.rule;
		}
		if (pass) {
			if (pass.$deep) deepPass = pass;
		} else {
			if (pass === false) return false;
		}
		sKey = tree.shift();
		if (!sKey) return pass || deepPass;
		current = sKey;
		if (isArray(rules)) {
			rules = flatten.call(rules.map(resolveRules, current)).filter(Boolean);
			if (!rules[0]) rules = null;
			else if (rules.length === 1) rules = rules[0];
		} else {
			rules = resolveRules.call(current, rules);
		}
		if (!rules) return deepPass;
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
		this.extend.clear();
		this.__fragment__.destroy();
	}),
	onAssign: d(function (dbObj) {
		var rules, args, sKey;
		if (this.__path__[dbObj.master.__id__]) return;
		rules = this.__rules__.assignment;
		if (!rules) return;
		if (dbObj._kind_ === 'descriptor') sKey = dbObj._sKey_;
		else sKey = dbObj._pSKey_;
		rules = pass(this.__object__, dbObj.object, sKey, rules);
		if (!rules) return;
		args = [dbObj.master, rules.property, rules.value, rules.assignment];
		this.__values__[dbObj.__id__] = { args: args };
		this.extend.apply(this, args);
	}),
	onDismiss: d(function (dbObj) {
		var data = this.__values__[dbObj.__id__];
		if (!data) return;
		this.extend.deleteRef.apply(this, data.args);
		delete this.__values__[dbObj.__id__];
	})
}, memoizeMethods({
	extend: d(function (object, rProperty, rValue, rAssignment) {
		return new Driver(this.__main__, object, this.__path__,
			{ property: rProperty, value: rValue, assignment: rAssignment });
	}, { getNormalizer: getNormalizer, refCounter: true,
		dispose: function (driver) { driver.destroy(); } })
}), autoBind({
	onUpdate: d(function (event) {
		var dbObj = event.object, kind = dbObj._kind_, old, value, rules, args
		  , removed, sKey;
		if (kind === 'object') return;
		if (kind === 'sub-descriptor') return;
		if (kind === 'descriptor') {
			value = event.value;
			sKey = dbObj._sKey_;
		} else {
			// Multiple item
			removed = !event.value;
			value = dbObj.key;
			sKey = dbObj._pSKey_;
		}
		old = this.__values__[dbObj.__id__];
		if (old) {
			if (!removed && (value === old.object)) return;
			this.extend.deleteRef.apply(this, old.args);
			delete this.__values__[dbObj.__id__];
		}
		if (removed) return;
		if (!value || !value.__id__ || (value._kind_ !== 'object')) return;
		if (this.__path__[value.master.__id__]) return;
		rules = this.__rules__.value;
		if (!rules) return;
		rules = pass(this.__object__, dbObj.object, sKey, rules);
		if (!rules) return;
		args = [value.master, rules.property, rules.value, rules.assignment];
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
	if ((rules.value == null) && (rules.assignment == null)) {
		return new ObjectFragment(obj, rules.property);
	}
	new Driver(fragment, obj, null, rules); //jslint: ignore
	return fragment;
};
