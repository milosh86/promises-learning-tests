/*global $, QUnit */
QUnit.module('JQuery Deferred');
// Promise chaining - have 2 functions that return promise, and want to execute the second one after the first one finish
QUnit.test("Promise chaining", function (assert) {
	'use strict';
	var done = assert.async();

	dAsyncFn(1).then(function (result) {
		assert.equal(result, 1, 'First promise resolved with 1');
		return dAsyncFn(2);
	}).then(function (result) {
		assert.equal(result, 2, 'Second promise resolved with 2, after first one completed');
		done();
	});
});

QUnit.test("Propagating and transforming result through multiple 'then's ", function (assert) {
	'use strict';
	var done = assert.async();

	dAsyncFn(1).then(function (result) {
		assert.equal(result, 1, 'First promise resolved with 1');
		return result + 10;
	}).then(function (result) {
		assert.equal(result, 11, 'Previous then added 10 to the initial result');
		done();
	});
});

QUnit.test("Errors/rejects are propagated to the fail callbacks - Reject in async function", function (assert) {
	'use strict';
	var done = assert.async();
	assert.expect(2);

	dAsyncFn(10).then(function (result) { // async 3 rejects
		assert.ok(false, 'Should not be called, because async operation failed!');
		return dAsyncFn(2);
	}).then(function (result) {
		assert.ok(false, 'Should not be called, because async operation failed!');
	}).fail(function (error) {
		assert.equal(error, 'operation failed', 'Fail callback called!');
	}).fail(function (error) {
		assert.equal(error, 'operation failed', 'Multiple fail callbacks could be registered');
		done();
	});
});
// jQuery promises are not throw safe - http://stackoverflow.com/questions/23744612/problems-inherent-to-jquery-deferred
//QUnit.test("Errors/rejects are propagated to the fail callbacks - Error thrown in then callback", function (assert) {
//	var done = assert.async();
//	assert.expect(3);
//
//	dAsyncFn(1).then(function (result) {
//		assert.equal(result, 1, 'First promise resolved with 1');
//		throw Error('thrown error');
//		return dAsyncFn(2);
//	}).then(function (result) {
//		assert.ok(false, 'Should not be called, because async operation failed!');
//	}).fail(function (error) {
//		assert.equal(error, 'thrown error', 'Fail callback called!');
//	}).fail(function (error) {
//		assert.equal(error, 'thrown error', 'Multiple fail callbacks could be registered');
//		done();
//	});
//});

QUnit.test("Fail callback should not handle errors in 'then' callback after", function (assert) {
	'use strict';
	var done = assert.async();
	assert.expect(2);

	dAsyncFn(1).fail(function (error) {
		assert.ok(false, 'Should not be called. it is defined befor error.');
	}).then(function (result) {
		assert.equal(result, 1, 'First promise resolved with 1');
		return dAsyncFn(10);
	}).then(function (result) {
		assert.ok(false, 'Should not be called. it is defined befor error.');
	}).fail(function (error) {
		assert.equal(error, 'operation failed', 'second fail callback');
		done();
	});
});



QUnit.test("jQuery when: result for each promise is submited to done callback", function (assert) {
	'use strict';
	var done = assert.async();

	var d1 = $.Deferred();
	var d2 = $.Deferred();
	var d3 = $.Deferred();
	 
	$.when(d1, d2, d3).done(function (v1, v2, v3) {
	    assert.equal(v1, 1, 'First promise resolved with 1');
		assert.equal(v2, 'abc', 'Second promise resolved with "abc"');
		assert.equal(v3[4], 5, 'Third promise resolved with array [1,2,3,4,5]');
		done();
	});
	 
	d1.resolve(1);
	d2.resolve( "abc" );
	d3.resolve( 1, 2, 3, 4, 5 );
});

QUnit.test("jQuery when: if any promise in list fail, failed callback is called", function (assert) {
	'use strict';
	var done = assert.async();
	//assert.expect(2);

	var d1 = $.Deferred();
	var d2 = $.Deferred();
	var d3 = $.Deferred();
	 
	$.when(d1, d2, d3).done(function (v1, v2, v3) {
	    assert.ok(false, 'Should not be called, one promise failed');
	}).fail(function (error) {
		assert.equal(error, 'failed', '"when" operation failed');
		done();
	});
	 
	d1.resolve(1);
	d2.reject("failed");
	d3.resolve( 1, 2, 3, 4, 5 );
});