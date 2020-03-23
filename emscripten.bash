#!/bin/bash

~/emscripten/emsdk activate latest

source ~/emscripten/emsdk_env.sh

emcc -O2 -s WASM=0 emscripten.cpp -o emscripten-asm.html
emcc -O2 -s WASM=1 emscripten.cpp -o emscripten-wasm.html