'use strict';

module.exports = function (t, a) {
	a.deep(t({}), {});
	a.deep(t({
		'/': 3,
		foo: 1,
		'foo/bar': 2,
		'foo/bar/elo': 7,
		'morka/miszka': 3,
		'foo/*/elo': 4
	}), {
		rule: 3,
		children: {
			foo: {
				rule: 1,
				children: {
					'*': {
						children: {
							elo: {
								rule: 4
							}
						}
					},
					bar: {
						rule: 2,
						children: {
							elo: {
								rule: 7
							}
						}
					}
				}
			},
			morka: {
				children: {
					miszka: {
						rule: 3
					}
				}
			}
		}
	});
};
