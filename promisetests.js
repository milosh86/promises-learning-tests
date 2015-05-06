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
			}, 500);
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

// JavaScript exceptions and promises:
// Rejections happen when a promise is explicitly rejected, but also implicitly if an error is thrown in the constructor callback
QUnit.test("Implicit rejection when error is thrown inside Promise constructor in sync operation", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(30) // throws error inside Promise's argument function
		.then(function (result) {
			assert.ok(false, "Should not be called!");
		})
		.catch(function (error) {
			assert.equal(error.message, "sync operation throws error", "Thrown error catched");
			done();
		});
});

QUnit.test("Implicit rejection in then", function (assert) {
	"use strict";
	var done = assert.async();

	pAsyncFn(1)
		.then(function (result) {
			assert.equal(result, 1, "First promise resolved with 1");
			throw Error('error in then');
		})
		.catch(function (error) {
			assert.equal(error.message, "error in then", "Thrown error catched");
			done();
		});
});

QUnit.test("When catch handles the error, following thens are executed, not skiped", function (assert) {
	"use strict";
	var done = assert.async();
	assert.expect(2);

	pAsyncFn(10)
		.then(function (result) {
			assert.ok(false, "Should not be called!");
		})
		.catch(function (error) {
			assert.equal(error, "operation failed", "Thrown error catched");
		})
		.then(function () {
			assert.ok(true, "Next then in the chain executed....could done some teardown work");
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
// If you pass it an instance of Promise it'll simply return it (note: this is a change to the spec that some implementations don't yet follow). 
// If you pass it something promise-like (has a 'then' method), it creates a genuine Promise that fulfills/rejects in the same way. 
// If you pass in any other value, eg Promise.resolve('Hello'), it creates a promise that fulfills with that value. 
// If you call it with no value, as above, it fulfills with "undefined".
//
// There's also Promise.reject(val), which creates a promise that rejects with the value you give it (or undefined).

QUnit.test("Promise.resolve: If you call it with no value, it fulfills with 'undefined'.", function (assert) {
	"use strict";
	var done = assert.async();
	assert.expect(1);

	Promise.resolve()
		.then(function (result) {
			assert.equal(result, undefined, 'Resolved with undefined');
			done();
		})
		.catch(function (error) {
			assert.ok(false, "Should not be called!");
		});
});

QUnit.test("Promise.resolve: If you call it with some value (non thenable), it fulfills with that value.", function (assert) {
	"use strict";
	var done = assert.async();

	Promise.resolve('Hello')
		.then(function (result) {
			assert.equal(result, 'Hello', 'Resolved with hello');
			done();
		})
		.catch(function (error) {
			assert.ok(false, "Should not be called!");
		});
});

QUnit.test("Promise.resolve: If you pass it something promise-like (has a 'then' method), it creates a genuine Promise (casts) that fulfills/rejects in the same way.", function (assert) {
	"use strict";
	var done = assert.async();

	Promise.resolve({then: function (onResolve, onReject) {
		onResolve('resolved');
	}})
		.then(function (result) {
			assert.equal(result, 'resolved', 'Resolved');
			done();
		})
		.catch(function (error) {
			assert.ok(false, "Should not be called!");
		});
});

QUnit.test("Promise.resolve: If you pass it something promise-like (has a 'then' method), it creates a genuine Promise (casts) that fulfills/rejects in the same way.", function (assert) {
	"use strict";
	var done = assert.async();

	Promise.resolve({then: function (onResolve, onReject) {
		onReject('rejected');
	}})
		.then(function (result) {
			assert.ok(false, "Should not be called!");
		})
		.catch(function (error) {
			assert.equal(error, 'rejected', 'Rejected');
			done();
		});
});

// Promise.all(iterable) method returns a promise that resolves when all of the promises in the iterable argument have resolved.
// The result is passed as an array of values from all the promises. 
QUnit.test("Promise.all: Returns promise that resolves when all passed in promises have resolved. The result is passed as an array of values from all the promises", function (assert) {
	"use strict";
	var done = assert.async();

	var p1 = Promise.resolve(1);
	var p2 = Promise.resolve(2);
	
	Promise.all([p1, p2]).then(function (result) {
		assert.equal(result[0], 1, 'p1 resolved with 1');
		assert.equal(result[1], 2, 'p2 resolved with 2');
		done();
	});
});

// If something passed in the iterable array is not a promise, it's converted to one by Promise.resolve.
QUnit.test("Promise.all: Casting with Promise.resolve non promise elements", function (assert) {
	"use strict";
	var done = assert.async();
	
	Promise.all([1, 2]).then(function (result) {
		assert.equal(result[0], 1, 'p1 resolved with 1');
		assert.equal(result[1], 2, 'p2 resolved with 2');
		done();
	});
});

// If any of the passed in promises rejects, the all Promise immediately rejects with the value of the promise that rejected, 
// discarding all the other promises whether or not they have resolved.
QUnit.test("Promise.all: Any promise rejection stops others", function (assert) {
	"use strict";
	var done = assert.async();
	
	var p1 = Promise.resolve(1);
	var p2 = Promise.reject('error');
	
	Promise.all([p1, p2]).then(function (result) {
		assert.ok(false, "Should not be called!");
		
	}).catch(function (error) {
		assert.equal(error, 'error', 'rejected');
		done();
	});
});


// The Promise.race(iterable) method returns a promise that resolves or rejects as soon as one of the promises 
// in the iterable resolves or rejects, with the value or reason from that promise.
// The race function returns a Promise that is settled the same way as the first passed promise to settle. It resolves or rejects, whichever happens first.
QUnit.test("Promise.race: First settled promise", function (assert) {
	"use strict";
	var done = assert.async();
	
	var p1 = new Promise(function(resolve, reject) { 
	    setTimeout(resolve, 500, "one"); 
	});
	var p2 = new Promise(function(resolve, reject) { 
	    setTimeout(resolve, 100, "two"); 
	});
	
	Promise.race([p1, p2]).then(function(result) {
	  assert.equal(result, 'two', 'Both resolve, but p2 is faster');
	  done();
	});
});




///////////////////////////
// Unhandled error failures
///////////////////////////
// it is not usefull to use async operations inside then.
//QUnit.test("Of course, implicit rejection in then fails when error is thrown in async operation", function (assert) {
//	"use strict";
//	var done = assert.async();
//
//	pAsyncFn(1)
//		.then(function (result) {
//			assert.equal(result, 1, "First promise resolved with 1");
//			
//			setTimeout(function() {
//				throw Error('error in then');
//			}, 1); 
//		})
//		.catch(function (error) {
//			assert.ok(false, "Should not be called!"); // not called
//			done();
//		});
//});
//
//QUnit.test("Implicit rejection does not work when error is thrown inside Promise constructor, but in async operation, because context is lost", function (assert) {
//	"use strict";
//	var done = assert.async();
//
//	pAsyncFn(20) // throws error inside Promise's argument function
//		.then(function (result) {
//			assert.ok(false, "Should not be called!");
//		})
//		.catch(function (error) {
//			assert.ok(false, "Should not be called!");
////			assert.equal(error.message, "async operation throws error", "Thrown error catched");
//			done();
//		});
//});
