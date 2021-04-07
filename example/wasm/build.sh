#!/bin/bash
em++ --profiling -O3 --bind -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=1 -s NO_DISABLE_EXCEPTION_CATCHING -s -s EXPORT_ES6=1 -s MODULARIZE=1 -o compiled/parser.js lammps_data_parser.cpp && cp compiled/parser.* ../src/wasm/