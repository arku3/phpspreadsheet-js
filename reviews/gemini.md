Gemini Review:
1. Use 'readonly' and private class members (#) extensively for better optimization in V8/Bun.
2. Consider using 'SharedArrayBuffer' if multi-threaded calculation is needed later.
3. Use 'Uint32Array' for coordinate indexing (row * 16384 + col) instead of string keys in the Map if performance bottlenecks occur.
4. Ensure 'ANCHORARRAY' correctly handles both implicit intersection and spilling logic.
