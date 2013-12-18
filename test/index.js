'use strict';

var toArray      = require('es6-iterator/to-array')
  , Database     = require('dbjs')
  , ObjectFamily = require('../object-family')

  , getId = function (obj) { return obj.__id__; };

module.exports = {
	"Auth object Legacy": function (T, a) {
		var db = new Database(), Type1, Type2, Type3, Type4, obj11, obj21, obj31
		  , obj32, obj33, obj41, plainObj
		  , set, updates, deletes, frag, frag2;

		Type3 = db.Object.extend('AFragTest3', { iteRemtest: { type: db.String } });
		Type1 = db.Object.extend('AFragTest1', {
			iteTestStr: { type: db.String },
			iteTestMulti: { type: db.String, multiple: true },
			otherObj: { type: Type3 },
			otherMultipleObj: { type: Type3, multiple: true }
		});
		Type2 = db.Object.extend('AFragTest2', {
			iteTest: { type: Type1, reverse: 'iteRev1' }
		});

		obj31 = new Type3({ iteRemtest: 'remotes' });
		obj11 = new Type1({ iteTestStr: 'foo', iteTestMulti: ['raz', 'dwa'],
			otherObj: obj31 });
		obj21 = new Type2({ iteTest: obj11 });

		frag = new ObjectFamily(obj11);
		set = new T();
		set.sets.add(frag);
		updates = [];
		set.on('update', function (event) { updates.push(event.object.__id__); });
		deletes = [];
		set.on('delete', function (id) { deletes.push(id); });

		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj, obj31, obj31.$iteRemtest,
				obj21, obj21.$iteTest].map(getId).sort(), "Initial");

		obj11.otherObj = null;
		a.deep(updates, [obj11.$otherObj.__id__], "Clear existing: Updates");
		updates.length = 0;
		a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
			"Clear existing: Deletes");
		deletes.length = 0;
		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj,
				obj21, obj21.$iteTest].map(getId).sort(), "Clear existing: Total");

		obj21.iteTest = null;
		a.deep(updates, [obj21.$iteTest.__id__], "Delete reverse: Updates");
		updates.length = 0;
		a.deep(deletes.sort(), [obj21, obj21.$iteTest].map(getId).sort(),
			"Delete reverse: Deletes");
		deletes.length = 0;
		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj].map(getId).sort(), "Delete reverse: Total");

		obj11.otherMultipleObj.add(obj31);
		a.deep(updates.sort(), [obj11.otherMultipleObj.$getOwn(obj31), obj31,
			obj31.$iteRemtest].map(getId).sort(), "Add obj item: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Add obj item: Deletes");
		deletes.length = 0;
		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj, obj11.otherMultipleObj.$getOwn(obj31), obj31,
				obj31.$iteRemtest].map(getId).sort(), "Add obj item: Total");

		obj11.otherMultipleObj.delete(obj31);
		a.deep(updates, [obj11.otherMultipleObj.$getOwn(obj31).__id__],
			"Delete obj item: Updates");
		updates.length = 0;
		a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
			"Delete obj item: Deletes");
		deletes.length = 0;
		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj].map(getId).sort(),
			"Delete obj item: Total");

		obj32 = new Type3();
		obj11.otherMultipleObj.delete(obj32);
		a.deep(updates, [obj11.otherMultipleObj.$getOwn(obj32).__id__],
			"Invoke delete item: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Invoke delete item: Deletes");
		deletes.length = 0;
		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj].map(getId).sort(),
			"Invoke delete item: Total");

		Type1 = db.Object.extend('AFragTest11');
		Type2 = db.Object.extend('AFragTest12');
		Type3 = db.Object.extend('AFragTest13', { foo: { type: db.String } });
		Type4 = db.Object.extend('AFragTest14');

		Type1.set('first', Type2);
		Type2.set('second', Type3);
		Type3.set('third', Type1);
		Type3.set('fourth', Type4);

		obj41 = new Type4();
		obj33 = new Type3({ third: obj11, foo: 'lorem', fourth: obj41 });
		obj21.second = obj33;
		obj11.first = obj21;

		plainObj = new db.Object();
		frag2 = new ObjectFamily(plainObj);
		set = new T();
		set.sets.add(frag2);
		set.sets.add(frag);
		updates = [];
		set.on('update', function (event) { updates.push(event.object.__id__); });
		deletes = [];
		set.on('delete', function (id) { deletes.push(id); });

		a.deep(toArray(set).map(getId).sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj,
				obj11.$first, obj21, obj21.$iteTest, obj21.$second, obj33,
				obj33.$third, obj33.$foo, obj33.$fourth, obj41,
				plainObj].map(getId).sort(),
			"Circular: Initial");

		set.sets.delete(frag);
		a.deep(updates.sort(), [], "Circular: Update");
		a.deep(deletes.sort(), [obj11, obj11.$iteTestStr,
			obj11.iteTestMulti.$getOwn('raz'),
			obj11.iteTestMulti.$getOwn('dwa'),
			obj11.$otherObj,
			obj11.$first, obj21, obj21.$iteTest, obj21.$second, obj33,
			obj33.$third, obj33.$foo, obj33.$fourth, obj41].map(getId).sort(),
			"Circular: Delete");
		a.deep(toArray(set).map(getId).sort(),
			[plainObj].map(getId).sort(), "Circular: Delete: Total");
	},
	"Index Legacy": function (T, a) {
		var db = new Database(), Type1, Type2, Type3, obj11, obj21, obj31, obj32
		  , set, updates, deletes, frag11, frag21, frag31;

		Type3 = db.Object.extend('FragTest34', { iteRemtest: { type: db.String } });
		Type1 = db.Object.extend('FragTest14', {
			iteTestStr: { type: db.String },
			iteTestMulti: { type: db.String, multiple: true },
			otherObj: { type: Type3 },
			otherMultipleObj: { type: Type3, multiple: true }
		});
		Type2 = db.Object.extend('FragTest24', {
			iteTest: { type: Type1, reverse: 'iteRev1' }
		});

		obj31 = new Type3({ iteRemtest: 'remotes' });
		obj11 = new Type1({ iteTestStr: 'foo', iteTestMulti: ['raz', 'dwa'],
			otherObj: obj31 });
		obj21 = new Type2({ iteTest: obj11 });

		set = new T();
		updates = [];
		set.on('update', function (event) { updates.push(event.object.__id__); });
		deletes = [];
		set.on('delete', function (id) { deletes.push(id); });

		// Add obj11
		frag11 = new ObjectFamily(obj11);
		set.sets.add(frag11);
		a.deep(updates.sort(),
			[obj11, obj11.$iteTestStr,
				obj11.iteTestMulti.$getOwn('raz'),
				obj11.iteTestMulti.$getOwn('dwa'),
				obj11.$otherObj, obj31, obj31.$iteRemtest,
				obj21, obj21.$iteTest].map(getId).sort(), "Updates");
		updates.length = 0;
		a.deep(deletes, [], "Deletes");
		deletes.length = 0;

		// Add obj31
		frag31 = new ObjectFamily(obj31);
		set.sets.add(frag31);
		a.deep(updates, [], "Add existing: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Add existing: Deletes");
		deletes.length = 0;

		obj11.otherObj = null;
		a.deep(updates, [obj11.$otherObj.__id__], "Clear existing: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Clear existing: Deletes");
		deletes.length = 0;

		// Delete obj31
		set.sets.delete(frag31);
		a.deep(updates, [], "Delete existing: Updates");
		updates.length = 0;
		a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
			"Delete existing: Deletes");
		deletes.length = 0;

		obj21.iteTest = null;
		a.deep(updates, [obj21.$iteTest.__id__], "Delete reverse: Updates");
		updates.length = 0;
		a.deep(deletes.sort(), [obj21, obj21.$iteTest].map(getId).sort(),
			"Delete reverse: Deletes");
		deletes.length = 0;

		// Add obj21
		frag21 = new ObjectFamily(obj21);
		set.sets.add(frag21);
		a.deep(updates, [obj21, obj21.$iteTest].map(getId), "Add other: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Add other: Deletes");
		deletes.length = 0;

		obj11.otherMultipleObj.add(obj31);
		a.deep(updates.sort(), [obj11.otherMultipleObj.$getOwn(obj31), obj31,
			obj31.$iteRemtest].map(getId).sort(), "Add obj item: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Add obj item: Deletes");
		deletes.length = 0;

		obj11.otherMultipleObj.delete(obj31);
		a.deep(updates, [obj11.otherMultipleObj.$getOwn(obj31).__id__],
			"Add obj item: Updates");
		updates.length = 0;
		a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
			"Add obj item: Deletes");
		deletes.length = 0;

		obj32 = new Type3();
		obj11.otherMultipleObj.delete(obj32);
		a.deep(updates, [obj11.otherMultipleObj.$getOwn(obj32).__id__],
			"Invoke delete item: Updates");
		updates.length = 0;
		a.deep(deletes, [], "Invoke delete item: Deletes");
		deletes.length = 0;
	}
};
