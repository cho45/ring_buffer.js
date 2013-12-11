#!/usr/bin/env node

var assert = require('assert');

var RingBuffer = require('../lib/ring_buffer.js').RingBuffer;


var assert = require("assert");

(function () {
	var buf = new RingBuffer(new Array(5));

	buf.put(1, 2, 3);

	assert.equal(buf.length, 3);
	assert.equal(buf.get(0), 1);
	assert.equal(buf.get(1), 2);
	assert.equal(buf.get(2), 3);
	assert.equal(buf.get(-1), 3);

	buf.put(4, 5, 6);

	assert.equal(buf.length, 5);
	assert.equal(buf.get(0), 2); // drop first
	assert.equal(buf.get(1), 3);
	assert.equal(buf.get(2), 4);
	assert.equal(buf.get(-1), 6);

	assert.equal(buf.remove(), 2);
	assert.equal(buf.length, 4);
})();

(function () {
	var buf = new RingBuffer(new Uint32Array(5));

	buf.put(1, 2, 3);

	assert.equal(buf.length, 3);
	assert.equal(buf.get(0), 1);
	assert.equal(buf.get(1), 2);
	assert.equal(buf.get(2), 3);
	assert.equal(buf.get(-1), 3);

	buf.put(4, 5, 6);

	assert.equal(buf.length, 5);
	assert.equal(buf.get(0), 2); // drop first
	assert.equal(buf.get(1), 3);
	assert.equal(buf.get(2), 4);
	assert.equal(buf.get(-1), 6);

	assert.equal(buf.remove(), 2);
	assert.equal(buf.length, 4);
})();

(function () {
	var buf = new RingBuffer.Fast(new Array(8));

	buf.put(1, 2, 3);

	assert.equal(buf.length, 3);
	assert.equal(buf.get(0), 1);
	assert.equal(buf.get(1), 2);
	assert.equal(buf.get(2), 3);
	assert.equal(buf.get(-1), 3);

	buf.put(4, 5, 6, 7, 8, 9);

	assert.equal(buf.length, 8);
	assert.equal(buf.get(0), 2); // drop first
	assert.equal(buf.get(1), 3);
	assert.equal(buf.get(2), 4);
	assert.equal(buf.get(-1), 9);

	assert.equal(buf.remove(), 2);
	assert.equal(buf.length, 7);
})();

(function () {
	var buf = new RingBuffer.Typed2D(Uint8Array, 3, 5);

	buf.put(
		new Uint8Array([1, 2, 3]),
		new Uint8Array([4, 5, 6])
	);

	assert.equal(buf.get(0)[0], 1);
	assert.equal(buf.get(0)[1], 2);
	assert.equal(buf.get(0)[2], 3);

	assert.equal(buf.get(1)[0], 4);
	assert.equal(buf.get(1)[1], 5);
	assert.equal(buf.get(1)[2], 6);

	buf.put(
		new Uint8Array([3, 3, 3]),
		new Uint8Array([4, 4, 4]),
		new Uint8Array([5, 5, 5]),
		new Uint8Array([6, 6, 6]) // over
	);

	assert.equal(buf.get(0)[0], 4);
	assert.equal(buf.get(0)[1], 5);
	assert.equal(buf.get(0)[2], 6);

	var a = buf.nextSubarray();
	a[0] = 7; a[1] = 7; a[2] = 7;

	assert.equal(buf.get(0)[0], 3);
	assert.equal(buf.get(0)[1], 3);
	assert.equal(buf.get(0)[2], 3);

	assert.equal(buf.get(-1)[0], 7);
	assert.equal(buf.get(-1)[1], 7);
	assert.equal(buf.get(-1)[2], 7);
})();

if (process.env['BENCHMARK']) (function () {
	var r1 = new RingBuffer(new Uint32Array(Math.pow(2, 20)));
	var r2 = new RingBuffer.Fast(new Uint32Array(Math.pow(2, 20)));
	var r3 = new RingBuffer(new Uint32Array(Math.pow(2, 20)-1));
	var  a = new Uint32Array(44100);
	benchmark({
		"RingBuffer" : function () {
			var buf = r1;

			buf.put.apply(buf, a);
			for (var i = 0; i < 44100; i++) {
				buf.remove(i);
			}
		},
		"RingBuffer.Fast" : function () {
			var buf = r2;

			buf.put.apply(buf, a);
			for (var i = 0; i < 44100; i++) {
				buf.remove(i);
			}
		},
		"RingBuffer - 1" : function () {
			var buf = r3;

			buf.put.apply(buf, a);
			for (var i = 0; i < 44100; i++) {
				buf.remove(i);
			}
		}
	});
	
	var data = new Uint8Array(1024);
	var typed1 = new RingBuffer.Typed2D(Uint8Array, 1024, 100);
	var typed2 = new RingBuffer(new Array(100));
	for (var i = 0; i < 100; i++) {
		typed2.put(new Uint8Array(1024));
	}

	benchmark({
		"RingBuffer.Typed2D" : function () {
			for (var i = 0; i < 200; i++) {
				typed1.nextSubarray().set(data, 0);
			}

			var a;
			for (var i = 0; i < 200; i++) {
				a = typed1.get(i);
			}
		},
		"RingBuffer" : function () {
			for (var i = 0; i < 200; i++) {
				var buf = typed2.remove();
				buf.set(data, 0);
				typed2.put(buf);
			}

			var a;
			for (var i = 0; i < 200; i++) {
				a = typed2.get(i);
			}
		}
	});

	// ============================================================================
	// try n counts in 1sec
	function measure (fun) {
		var now, start = new Date().getTime();
		var count = 0, n = 500;
		do {
			for (var i = 0; i < n; i++) fun();
			count += n;
			now = new Date().getTime();
		} while ( (now - start) < 1000);
		return (count / (now - start)) * 1000;
	}

	function benchmark (funcs) {
		var os = require('os');
		console.log('%s (%s) %s %s', os.type(), os.platform(), os.arch(), os.release());
		console.log(os.cpus());

		var empty = 1000 / measure(function () {});
		console.log('empty function call: %d msec', empty);

		var result = [];
		for (var key in funcs) if (funcs.hasOwnProperty(key)) {
			console.log('running... %s', key);
			result.push({ name : key, counts : measure(funcs[key]) });
		}
		result.sort(function (a, b) { return b.counts - a.counts });

		console.log('=== result ===');

		for (var i = 0, it; (it = result[i]); i++) {
			console.log("%d: (%d msec) %s", it.counts.toFixed(1), (1000 / it.counts - (empty * it.counts)).toFixed(3), it.name);
		}
	}

})();
