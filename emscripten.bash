#!/bin/bash

~/emscripten/emsdk activate latest

source ~/emscripten/emsdk_env.sh

emcc -O2 --memory-init-file 0 -s WASM=0 --bind -s MODULARIZE=1 -s EXPORT_NAME="'Assembly'" -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap', '_render', '_uniform1i', '_uniform1f', '_uniform3fv']" emscripten.cpp -o emscripten-asm.js
emcc -O2 --memory-init-file 0 -s WASM=1 --bind -s MODULARIZE=1 -s EXPORT_NAME="'Webassembly'" -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap', '_render', '_uniform1i', '_uniform1f', '_uniform3fv']" emscripten.cpp -o emscripten-wasm.js