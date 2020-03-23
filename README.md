# wasm-raytracer
While teaching a web development class, I wanted to present some benchmarks that show the performance benefits of asm.js as well as WebAssembly. I was unfortunately not able to find a suitable reference. Therefore, I implemented a simplistic [raytracer](http://sniklaus.com/raytracer) in JavaScript as well as in C++ with a similar code structure while utilizing Emscripten to compile the C++ raytracer to asm.js as well as WebAssembly. For fun, I also translated the code to GLSL and am utilizing WebGL to leverage GPU computing.

<p align="center"><a href="https://sniklaus.com/wasmray" rel="Paper"><img src="https://content.sniklaus.com/wasmray/screenshot.png" alt="Screenshot"></a></p>

For a live demo, please see: https://sniklaus.com/wasmray
<br />
For a discussion, see Reddit: https://www.reddit.com/r/programming/comments/7k4v5t/

## benchmark
Unsurprisingly, the version using GLSL / Shader is significantly faster than the others, showing that it is always important to use the right technology for the right purpose. However, this was not the point of this experiment. Instead, it shows how WebAssembly can potentially be used for an improved performance. To accelerate WebAssembly further, [threads](https://github.com/WebAssembly/threads) could be leveraged. Of course, one could make the argument that a different task could have shown the performance advantages of WebAssembly better. However, I also simply wanted to implement a raytracer.

|Browser|JavaScript|asm.js|WebAssembly|GLSL / Shader|
|---|---:|---:|---:|---:|
|Firefox 57|~407.3 ms|~112.3 ms|~87.4 ms|~1.9 ms|
|Firefox 58|~358.9 ms|~103.2 ms|~82.7 ms|~1.9 ms|
|Chrome 62|~191.7 ms|~167.2 ms|~115.7 ms|~2.1 ms|
|Chrome 63|~181.4 ms|~154.2 ms|~120.7 ms|~2.2 ms|

Note that the JavaScript performance of Firefox 57 is significantly affected by a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1425687) that has since been fixed. One might also wonder why asm.js in Chrome is slower than JavaScript, which is due to Chrome not having accelerated support for asm.js in the first place.

## license
Please refer to the appropriate file within this repository.