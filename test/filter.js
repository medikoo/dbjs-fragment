'use strict';

var toArray    = require('es6-iterator/to-array')
  , Database   = require('dbjs')
  , objectFrag = require('../object-family')

  , getId = function (obj) { return obj.__valueId__; };

module.exports = function (t, a) {
	var db = new Database(), Type1, Type2, Type3, obj11, obj21, obj31, obj32
	  , iterator, updates, deletes, frag;

	Type3 = db.Object.extend('FragFilterTest3',
		{ iteRemtest: { type: db.String } });
	Type1 = db.Object.extend('FragFilterTest1', {
		iteTestStr: { type: db.String },
		iteTestMulti: { type: db.String, multiple: true },
		otherObj: { type: Type3 },
		otherMultipleObj: { type: Type3, multiple: true }
	});
	Type2 = db.Object.extend('FragFilterTest2', {
		iteTest: { type: Type1, reverse: 'iteRev1' }
	});

	obj31 = new Type3({ iteRemtest: 'remotes' });
	obj11 = new Type1({ iteTestStr: 'foo', iteTestMulti: ['raz', 'dwa'],
		otherObj: obj31 });
	obj21 = new Type2({ iteTest: obj11 });

	frag = objectFrag(obj11);

	iterator = t(frag, function (obj) { return obj.__id__.indexOf('*') === -1; });
	a.deep(toArray(iterator).map(getId).sort(), [obj11, obj11.$iteTestStr,
		obj11.$otherObj, obj31, obj31.$iteRemtest, obj21,
		obj21.$iteTest].map(getId).sort(), "Objects");
	updates = [];
	iterator.on('update', function (event) {
		updates.push(event.object.__valueId__);
	});
	deletes = [];
	iterator.on('delete', function (id) { deletes.push(id); });

	obj11.otherObj = null;
	a.deep(updates, [obj11.$otherObj.__valueId__], "Clear existing: Updates");
	updates.length = 0;
	a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
			"Clear existing: Deletes");
	deletes.length = 0;

	obj21.iteTest = null;
	a.deep(updates, [obj21.$iteTest.__valueId__], "Remove reverse: Updates");
	updates.length = 0;
	a.deep(deletes.sort(), [obj21, obj21.$iteTest].map(getId).sort(),
		"Remove reverse: Deletes");
	deletes.length = 0;

	obj11.otherMultipleObj.add(obj31);
	a.deep(updates.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
		"Add obj item: Updates");
	updates.length = 0;
	a.deep(deletes, [], "Add obj item: Deletes");
	deletes.length = 0;

	obj11.otherMultipleObj.delete(obj31);
	a.deep(updates, [], "Delete obj item: Updates");
	updates.length = 0;
	a.deep(deletes.sort(), [obj31, obj31.$iteRemtest].map(getId).sort(),
		"Delete obj item: Deletes");
	deletes.length = 0;

	obj32 = new Type3();
	obj11.otherMultipleObj.delete(obj32);
	a.deep(updates, [], "Invoke delete item: Updates");
	updates.length = 0;
	a.deep(deletes, [], "Invoke delete item: Deletes");
	deletes.length = 0;
};
