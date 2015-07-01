'use strict';

var toArray  = require('es5-ext/array/to-array')
  , Database = require('dbjs')

  , getId = function (obj) { return obj.__valueId__; };

module.exports = function (T, a) {
	var db = new Database(), obj, updates = [], fragment, Type;

	Type = db.Object.extend('ObjFragTest', { foo: { type: db.String,
		multiple: true }, restricted: { type: db.String, multiple: true } });
	obj = new Type({ marko: 12 });
	obj.define('pablo', { type: db.String, multiple: true,
		value: ['foo', 'bar'] });

	obj.restricted.add('foo');

	fragment = new T(obj, { '/': 2, restricted: 0 });
	fragment.on('update', function (event) { updates.push(event.object); });

	a.deep(toArray(fragment).map(getId).sort(), [obj, obj.$marko,
		obj.$pablo.$type, obj.$pablo.$multiple, obj.pablo.$getOwn('foo'),
		obj.pablo.$getOwn('bar')].map(getId).sort(), "Initial");

	obj.foo.add('dwa');
	a.deep(updates, [obj.foo.$getOwn('dwa')], "Add multiple");
	updates.length = 0;

	obj.marko = 'raz';
	a.deep(updates, [obj.$marko], "Set value");
	updates.length = 0;

	obj.restricted.add('bar');
	obj.$restricted.required = true;
	a.deep(updates, [], "Update restricted");

	Type = db.Object.extend('ObjFragTest1',
		{ foo: { type: db.Object, nested: true }, someNested: { type: db.Object, nested: true } });
	Type.prototype.someNested.define('otherNested', {
		nested: true,
		type: db.Object
	});

	obj = new Type();
	fragment = new T(obj.foo, { raz: 1 });
	updates = [];
	fragment.on('update', function (event) { updates.push(event.object); });
	obj.foo.set('raz', 'dwa');
	a.deep(updates, [obj.foo.$raz], "Non master fragment");

	obj = new Type();
	obj.someNested.otherNested.set('elo', true);
	fragment = new T(obj, { 'someNested/otherNested/elo': 1 });
	updates = [];
	fragment.on('update', function (event) { updates.push(event.object); });
	obj.someNested.otherNested.set('elo', 12);
	a.deep(updates, [obj.someNested.otherNested.$elo], "Deep nested");

	obj = new Type();
	obj.someNested.otherNested.set('elo', true);
	fragment = new T(obj, { 'someNested/*/elo': 1 });
	updates = [];
	fragment.on('update', function (event) { updates.push(event.object); });
	obj.someNested.otherNested.set('elo', 12);
	a.deep(updates, [obj.someNested.otherNested.$elo], "Deep nested");

	obj = new Type();
	obj.someNested.otherNested.set('elo', true);
	fragment = new T(obj, { 'someNested/*/elo': 1, 'someNested/otherNested/elo': 0 });
	updates = [];
	fragment.on('update', function (event) { updates.push(event.object); });
	obj.someNested.otherNested.set('elo', 12);
	a.deep(updates, [], "Deep nested");

	obj = new Type();
	obj.someNested.otherNested.set('elo', true);
	fragment = new T(obj, { 'someNested/*/*': 1 });
	updates = [];
	fragment.on('update', function (event) { updates.push(event.object); });
	obj.someNested.otherNested.set('elo', 12);
	a.deep(updates, [obj.someNested.otherNested.$elo], "Deep nested");
};
