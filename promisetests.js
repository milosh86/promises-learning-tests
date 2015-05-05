/*global $, QUnit */

// A promise can be:
// - fulfilled: The action relating to the promise succeeded 
// - rejected: The action relating to the promise failed 
// - pending: Hasn't fulfilled or rejected yet 
// - settled: Has fulfilled or rejected

QUnit.module('Promise/A+');
QUnit.test("Promise successfuly resolved", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(1).then(function (result) {
		assert.equal(result, 1, "Promise resolved with 1");
		done();
	});
});

QUnit.test("Handling Promise reject in 'then'", function (assert) {
	"use strict";
	var done = assert.async();
	
	assert.expect(1);

	pAsyncFn(10).then(function (result) {
		assert.ok(false, "Should not be called!");
	}, function (error) {
		assert.equal(error, "operation failed", "Promise rejected and handled in then's error callback");
		done();
	});
});

QUnit.test("Promise saves fullfiled value, so you can attach 'then' multiple times before or after promise is settled", function (assert) {
	"use strict";
	var done = assert.async();
	var p = new Promise(function (resolve, reject) {
		resolve(1);
	});
	
	p.then(function (value) {
		assert.equal(value, 1, 'First value = 1');
	});
	
	p.then(function (value) {
		assert.equal(value, 1, 'The same value second time');
		done();
	});
});

QUnit.test("Handling Promise reject in 'catch'", function (assert) {
	"use strict";
	var done = assert.async();
	
	assert.expect(1);

	pAsyncFn(10).then(function (result) {
		assert.ok(false, "Should not be called!");
	}).catch(function (error) {
		assert.equal(error, "operation failed", "Promise rejected and handled in then's error callback");
		done();
	});
});

// If you return a value, the next "then" is called with that value. 
// However, if you return something promise-like, the next "then" waits on it, 
// and is only called when that promise settles (succeeds/fails).
QUnit.test("If value is returned in OnResolved callback, that value is passed to the next OnResolved callback in the chain", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(2).then(function (result) {
		assert.equal(result, 2, "Promise resolved with value 2");
		return 2 * result;
	}).then(function (result) {
		assert.equal(result, 4, "Received value 4 from previous OnResolved callback");
		done();
	});
});

QUnit.test("If promise is returned in OnResolved callback, the next OnResolved callback in the chain is called with resolved value of first one", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(2).then(function (result) {
		assert.equal(result, 2, "Promise resolved with value 2");
		return pAsyncFn(3);
	}).then(function (result) {
		assert.equal(result, 3, "Second Promise resolved with value 3");
		done();
	});
});

QUnit.test("If thenable object is returned in OnResolved callback, the next OnResolved callback in the chain is called with returned value from OnResolve callback in then function", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(2).then(function (result) {
		assert.equal(result, 2, "Promise resolved with value 2");
		
		var thenable = {then: function (onResolve, onReject) {
			setTimeout(function() {
				onResolve(3);
			}, 2000);
		}};
		// wrong! ... then is called by Promise automatically (thenable is actually casted to Promise)
//		setTimeout(function() {
//			thenable.then(function (result) {
//				return result;
//			});
//		}, 3000);
		return thenable;
	}).then(function (result) {
		assert.equal(result, 3, "Thenable object resolved with value 3");
		done();
	});
});

QUnit.test("If thenable object is returned in OnResolved callback, the next OnReject callback in the chain is called with returned value from OnReject callback in then function", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(2).then(function (result) {
		assert.equal(result, 2, "Promise resolved with value 2");
		
		var thenable = {
			then: function (onResolve, onReject) {
				pAsyncFn(3).then(function() {
					onReject('rejected');
				});
			}};

		return thenable;
	}).then(function (result) {
		assert.equal(result, 3, "Thenable object resolved with value 3");
	}).catch(function (err) {
		assert.equal(err, "rejected", "Rejected");
		done();
	});
});

// Promise chaining - have 2 functions that return promise, and want to execute the second one after the first one finish
// you can chain "then"s together to transform values or run additional async actions one after another.
QUnit.test("Promise chaining - summing up", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(1)
		.then(function (result) {
			assert.equal(result, 1, "First promise resolved with 1");
			return pAsyncFn(2);
		})
		.then(function (result) {
			assert.equal(result, 2, "Second promise resolved with 2, after first one completed");
			return result * 2;
		})
		.then(function (result) {
			assert.equal(result, 4, "Value fulfilled from the second promise transformed (doubled)");
			done();
		});
});

QUnit.test("catch only handles errors happened before", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(1)
		.catch(function () {
			assert.ok(false, "Should not be called!");
		})
		.then(function (result) {
			assert.equal(result, 1, "First promise resolved with 1");
			return pAsyncFn(10); //error
		})
		.then(function (result) {
			assert.ok(false, "Should not be called!");
		}, function (error) {
			assert.equal(error, "operation failed", "Error catched");
			done();
		});
});

QUnit.test("catch can return new promise (recovery)", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(10)
		.then(function (result) {
			assert.ok(false, "Should not be called!");
		})
		.catch(function (error) {
			assert.equal(error, "operation failed", "Error catched, try recovery");
			return pAsyncFn(1);
		})
		.then(function (result) {
			assert.equal(result, 1, "Recovery successful");
			done();
		});
});



// Promise.resolve
// The Promise.resolve(value) method returns a Promise object that is resolved with the given value. 
// If the value is a thenable (i.e. has a then method), the returned promise will "follow" that thenable, 
// adopting its eventual state; otherwise the returned promise will be fulfilled with the value.
// Syntax:
// Promise.resolve(value);
// Promise.resolve(promise);
// Promise.resolve(thenable);