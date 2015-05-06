/*global $, Promise*/
function dAsyncFn(n) {
	'use strict';
	var r = $.Deferred();
	setTimeout(function () {
		if (n === 10) {
			r.reject('operation failed');
		}
		if (n === 20) {
			throw new Error('async operation throws error'); // unhandled
		}
		r.resolve(n);
	}, 100);
	
	if (n === 30) {
		throw new Error('sync operation throws error'); // unhandled
	}

	return r.promise();
}

function pAsyncFn(n) {
	'use strict';
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			if (n === 10) {
				reject('operation failed');
			}
			if (n === 20) {
				throw new Error('async operation throws error'); // could not be catched in then or catch. Use reject instead.
			}
			resolve(n);
		}, 100);
		
		if (n === 30) {
			throw new Error('sync operation throws error');
		}
	});
}
