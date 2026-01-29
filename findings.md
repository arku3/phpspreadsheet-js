# Findings - Calculation Engine

## Current State
- `FormulaParser` is implemented and can tokenize strings.
- `Stack` is implemented for managing tokens during evaluation.
- `FormulaToken` defines the token types and subtypes using `const` objects.
- `Coordinate` utility exists for A1 <-> Row/Col conversion.

## Key Logic to Port (from PHP)
- `processTokenStack`: The loop that consumes tokens and manages the evaluation stack.
- `executeBinaryOperator`: Handling math and comparison.
- `executeFunction`: Dispatching to registered function implementations.

## Function Registry Structure
- Should allow easy addition of new functions.
- Functions should receive arguments as an array of values (resolved from references).

## Reference Resolution
- Needs access to the `Worksheet` or `Spreadsheet` instance to fetch cell values.
- Must handle circular references (eventually).
