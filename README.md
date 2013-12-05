ring_buffer.js
==============

- RingBuffer
- RingBuffer.Fast (optimized for power of 2 length)
- RingBuffer.Typed2D (2D Array of Array with one TypedArray)

SYNOPSYS
========

```
var buf = new RingBuffer(new Array(10));

buf.put(1);

buf.get(1);

```


```
var buf = new RingBuffer.Fast(new Uint8Array(256));

buf.put(1);

buf.get(1);

```

```
// unit=1024, length=30 (like array[1023][29])
var fftResults = new RingBuffer.Typed2D(Uint8Array, 1024, 30);

// example: WebAudio FFT results array
// nextSubarray() returns next subarray of buffer and increments write index.
analyser.getByteFrequencyData(fftResults.nextSubarray());

```

DESCRIPTION
===========

RingBuffer.Fast is same interface with RingBuffer.

