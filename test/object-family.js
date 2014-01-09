'use strict';

var toArray  = require('es6-iterator/to-array')
  , Database = require('dbjs')
  , Rules    = require('../rules')

  , getId = function (obj) { return obj.__valueId__; };

module.exports = function (T, a) {
	var db = new Database(), Type1, Type2, Type3, obj11, obj21, obj31, obj32
	  , set, updates, deletes, rules;

	Type3 = db.Object.extend('FragTest3', { iteRemtest: { type: db.String } });
	Type1 = db.Object.extend('FragTest1', {
		iteTestStr: { type: db.String },
		iteTestMulti: { type: db.String, multiple: true },
		otherObj: Type3,
		otherMultipleObj: { type: Type3, multiple: true }
	});
	Type3.prototype.define('forbiddenMultipleObj',
		{ type: Type1, multiple: true });
	Type2 = db.Object.extend('FragTest2', {
		iteTest: { type: Type1,  reverse: 'iteRev1' }
	});

	obj31 = new Type3({ iteRemtest: 'remotes' });
	obj11 = new Type1({ iteTestStr: 'foo', iteTestMulti: ['raz', 'dwa'],
		otherObj: obj31 });
	obj32 = new Type3({ forbiddenMultipleObj: [obj11] });
	obj21 = new Type2({ iteTest: obj11 });

	rules = new Rules();
	rules.assignment.forbiddenMultipleObj = false;
	set = new T(obj11, rules);

	a.h1("Init");
	a.deep(toArray(set).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.iteTestMulti.$getOwn('raz'), obj11.iteTestMulti.$getOwn('dwa'),
		obj11.$otherObj, obj31, obj31.$iteRemtest, obj21,
		obj21.$iteTest].map(getId).sort(), "Content");
	updates = [];
	set.on('update', function (event) { updates.push(event.object.__valueId__); });
	deletes = [];
	set.on('delete', function (id) { deletes.push(id); });

	a.h1("Clear value");
	obj11.otherObj = null;
	a.deep(toArray(set).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.iteTestMulti.$getOwn('raz'), obj11.iteTestMulti.$getOwn('dwa'),
		obj11.$otherObj, obj21,
		obj21.$iteTest].map(getId).sort(), "Content");
	a.deep(updates, [obj11.$otherObj.__valueId__], "Update events");
	updates.length = 0;
	a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
		"Delete events");
	deletes.length = 0;

	a.h1("Clear assignment");
	obj21.iteTest = null;
	a.deep(toArray(set).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.iteTestMulti.$getOwn('raz'), obj11.iteTestMulti.$getOwn('dwa'),
		obj11.$otherObj].map(getId).sort(), "Content");
	a.deep(updates, [obj21.$iteTest.__valueId__], "Update events");
	updates.length = 0;
	a.deep(deletes.sort(), [obj21, obj21.$iteTest].map(getId).sort(),
		"Delete events");
	deletes.length = 0;

	a.h1("Add multiple value");
	obj11.otherMultipleObj.add(obj31);
	a.deep(toArray(set).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.iteTestMulti.$getOwn('raz'), obj11.iteTestMulti.$getOwn('dwa'),
		obj11.$otherObj, obj11.otherMultipleObj.$getOwn(obj31), obj31,
		obj31.$iteRemtest].map(getId).sort(), "Content");
	a.deep(updates.sort(), [obj11.otherMultipleObj.$getOwn(obj31), obj31,
		obj31.$iteRemtest].map(getId).sort(), "Update events");
	updates.length = 0;
	a.deep(deletes, [], "Delete events");
	deletes.length = 0;

	a.h1("Clear multiple value");
	obj11.otherMultipleObj.delete(obj31);
	a.deep(toArray(set).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.iteTestMulti.$getOwn('raz'), obj11.iteTestMulti.$getOwn('dwa'),
		obj11.$otherObj].map(getId).sort(),
		"Content");
	a.deep(updates, [obj11.otherMultipleObj.$getOwn(obj31).__valueId__],
		"Update events");
	updates.length = 0;
	a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
		"Delete events");
	deletes.length = 0;

	a.h1("Delete deleted");
	obj32 = new Type3();
	a.deep(toArray(set).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.iteTestMulti.$getOwn('raz'), obj11.iteTestMulti.$getOwn('dwa'),
		obj11.$otherObj].map(getId).sort(),
		"Content");
	obj11.otherMultipleObj.delete(obj32);
	a.deep(updates, [obj11.otherMultipleObj.$getOwn(obj32).__valueId__],
		"Update events");
	updates.length = 0;
	a.deep(deletes, [], "Delete events");
	deletes.length = 0;
};
