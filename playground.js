function doAsync1(cb) {
	setTimeout(function() {
		cb('done');
	}, 1);	
}

function doAsync2() {
	return {
		then: function (cb) {
			cb('done');
		}
	};
}

doAsync1(function(value) {
  console.log('Got a value:' + value);
});

doAsync2().then(function(value) {
  console.log('Got a value:' + value);
});

function Promise(fn) {
	var callback;
	
	this.then = function then(cb) {
		callback = cb;
	};
	
	function resolve(value) {
		callback(value);
	}
	
	fn(resolve);
}

var p = new Promise(function (resolve) {
	resolve(2);
});

p.then(function (value) {console.log('result: ', value)});