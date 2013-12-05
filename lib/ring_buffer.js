var RingBuffer = function () { this.init.apply(this, arguments) };
RingBuffer.prototype = {
	init : function (buffer) {
		this.buffer = buffer;
		this.readIndex = 0;
		this.writeIndex = 0;
		this.length = 0;
		this.maxLength = buffer.length;
	},

	get : function (i) {
		if (i < 0) i += this.length;
		return this.buffer[(this.readIndex + i) % this.maxLength];
	},

	remove : function () {
		var ret = this.buffer[this.readIndex];
		this.readIndex = (this.readIndex + 1) % this.maxLength;
		if (this.length > 0) this.length--;
		return ret;
	},

	put : function (v) {
		var buffer = this.buffer;
		var maxLength = this.maxLength;
		var writeIndex = this.writeIndex;

		for (var i = 0, len = arguments.length; i < len; i++) {
			buffer[writeIndex] = arguments[i];
			writeIndex = (writeIndex + 1) % maxLength;
		}

		this.writeIndex = writeIndex;

		this.length += len;
		var over = this.length - maxLength;
		if (over > 0) {
			this.length = maxLength;
			this.readIndex = (this.readIndex + over) % maxLength;
		}
	}
};

RingBuffer.Fast = function () { this.init.apply(this, arguments) };
RingBuffer.Fast.prototype = {
	init : function (buffer) {
		if (buffer.length & (buffer.length-1)) {
			throw "buffer size must be power of 2";
		}
		this.buffer = buffer;
		this.readIndex = 0;
		this.writeIndex = 0;
		this.length = 0;
		this.maxLength = buffer.length;
		this.mask = this.maxLength - 1;
	},

	get : function (i) {
		if (i < 0) i += this.length;
		return this.buffer[(this.readIndex + i) & this.mask];
	},

	remove : function () {
		var ret = this.buffer[this.readIndex];
		this.readIndex = (this.readIndex + 1) & this.mask;
		if (this.length > 0) this.length--;
		return ret;
	},

	put : function (v) {
		var buffer = this.buffer;
		var mask = this.mask;
		var maxLength = this.maxLength;
		var writeIndex = this.writeIndex;

		for (var i = 0, len = arguments.length; i < len; i++) {
			buffer[writeIndex] = arguments[i];
			writeIndex = (writeIndex + 1) & mask;
		}

		this.writeIndex = writeIndex;

		this.length += len;
		var over = this.length - maxLength;
		if (over > 0) {
			this.length = maxLength;
			this.readIndex = (this.readIndex + over) & mask;
		}
	}
};

RingBuffer.Typed2D = function () { this.init.apply(this, arguments) };
RingBuffer.Typed2D.prototype = {
	init : function (type, unit, length) {
		this.buffer = new type(unit * length);
		this.readIndex = 0;
		this.writeIndex = 0;
		this.unit = unit;
		this.length = 0;
		this.maxLength = length;
	},

	get : function (i) {
		if (i < 0) i += this.length;
		var begin = ((this.readIndex + i) % this.maxLength) * this.unit;
		return this.buffer.subarray(begin, begin + this.unit );
	},

	put : function (v) {
		var buffer = this.buffer;
		var maxLength = this.maxLength;
		var writeIndex = this.writeIndex;
		var unit = this.unit;

		for (var i = 0, len = arguments.length; i < len; i++) {
			buffer.set(arguments[i], writeIndex * unit);
			writeIndex = (writeIndex + 1) % maxLength;
		}
		this.writeIndex = writeIndex;

		this.length += len;
		var over = this.length - maxLength;
		if (over > 0) {
			this.length = maxLength;
			this.readIndex = (this.readIndex + over) % maxLength;
		}
	},

	/**
	 * returns subarray of buffer for writing
	 */
	nextSubarray : function () {
		var begin = this.writeIndex * this.unit;
		var ret = this.buffer.subarray(begin, begin + this.unit);
		if (this.length < this.maxLength) {
			this.length++;
		} else {
			this.readIndex = (this.readIndex + 1) % this.maxLength;
		}
		this.writeIndex = (this.writeIndex + 1) % this.maxLength;
		return ret;
	}
};

this.RingBuffer = RingBuffer;
