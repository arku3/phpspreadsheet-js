# Calculation Parity (PhpSpreadsheet vs TS)

This document compares the PHP PhpSpreadsheet calculation engine (`php-src/src/PhpSpreadsheet/Calculation/*`) with the TypeScript implementation (`src/calculation/*`). It focuses on architectural parity and the concrete feature/function surface currently implemented in this repo.

## Overview: consolidation model

PHP (PhpSpreadsheet) is structured as a large calculation subsystem with:

- A central engine: `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`.
- A lexer/parser in the engine (newer path): `php-src/src/PhpSpreadsheet/Calculation/Calculation.php` (`internalParseFormula`, `processTokenStack`, precedence rules, union/intersection, range operator, etc.).
- A legacy, token-only parser (deprecated): `php-src/src/PhpSpreadsheet/Calculation/FormulaParser.php`.
- Function implementations spread across many category directories and many per-function classes (e.g. `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/*`, `php-src/src/PhpSpreadsheet/Calculation/MathTrig/*`, `php-src/src/PhpSpreadsheet/Calculation/TextData/*`, etc.), with function metadata centralized in `php-src/src/PhpSpreadsheet/Calculation/Functions.php`.

TS consolidates aggressively:

- One main engine class: `src/calculation/calculation.ts`.
- One formula tokenizer: `src/calculation/formula-parser.ts` (explicitly described as “Ported from PHP version”, and closely resembles `php-src/src/PhpSpreadsheet/Calculation/FormulaParser.php`).
- One function registry: `src/calculation/function-registry.ts`, populated by a small set of category files under `src/calculation/functions/*`.

Practical consequence: PHP’s function code is “many classes, many files”; TS is “few category files + a registry”. This is an intentional consolidation, but it also makes it easy for docs/status reports to overstate parity if they are not generated from the registry.

## Engine parity notes

### Tokenizer / parser

PHP has two relevant parsing layers:

- Primary parser is embedded in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php` (`internalParseFormula`). It handles operator precedence including range (`:`), intersection/union (`∩`/`∪`), unary negation (`~`), percent (`%`), and more.
- The deprecated `php-src/src/PhpSpreadsheet/Calculation/FormulaParser.php` produces a token stream but is not the full modern engine.

TS currently uses `src/calculation/formula-parser.ts`, which is a direct port of the deprecated `php-src/src/PhpSpreadsheet/Calculation/FormulaParser.php` with additional structured-reference handling.

Parity notes:

- Array constants: TS mirrors the legacy parser behavior by converting `{…}` into `ARRAY` / `ARRAYROW` pseudo-functions and then handling those in `src/calculation/calculation.ts` (`functionName === 'ARRAY'` / `ARRAYROW`). PHP’s primary engine converts matrix literals into `MKMATRIX` internally (`convertMatrixReferences` in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`). Different internal representation; similar user-facing behavior.
- Structured references: in PHP’s primary engine, structured references are parsed via `CALCULATION_REGEXP_STRUCTURED_REFERENCE` and delegated to `php-src/src/PhpSpreadsheet/Calculation/Engine/Operands/StructuredReference.php` (`StructuredReference::fromParser`, then `parse`). In TS, structured references are tokenized in `src/calculation/formula-parser.ts` (bracket-scanning) and resolved later in `src/calculation/calculation.ts` via `src/calculation/engine/structured-reference.ts`.
- Spill operator (`#`): PHP rewrites `A1#` to `ANCHORARRAY(A1)` via `CALCULATION_REGEXP_CELLREF_SPILL` in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`. TS implements an analogous rewrite in `src/calculation/calculation.ts` (`formula.replace(/...#/, 'ANCHORARRAY($1)')`).

Known gaps vs PHP’s primary engine parser:

- Operator set/precedence: TS evaluation precedence in `src/calculation/calculation.ts` (`PRECEDENCE`) only covers `^`, `*`, `/`, `+`, `-`, `&`, and comparison operators. PHP’s precedence includes `:`, `∩`, `∪`, unary negation `~`, etc. (`OPERATOR_PRECEDENCE` in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`).
- Union and intersection operators: TS has coordinate helpers (`src/utils/coordinate.ts` includes `resolveUnionAndIntersection`, `resolveUnion`, `resolveIntersection`), but the calculation evaluator in `src/calculation/calculation.ts` does not apply union/intersection operators during evaluation. PHP’s engine treats union/intersection as first-class operators.
- Scientific notation edge-case handling (legacy parser detail): PHP’s deprecated `FormulaParser.php` includes a “scientific notation check” around `E` with `+`/`-`. TS’s `src/calculation/formula-parser.ts` does not include that check, so tokenization of values like `1E-3` may diverge.
- Function name prefixes: PHP’s engine accepts prefixes like `@`, `_xlfn.`, `_xlws.` in its main parser regex (`CALCULATION_REGEXP_FUNCTION` in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`). TS currently strips only leading `@` in `src/calculation/formula-parser.ts`.
- Column/row ranges (e.g. `A:A`, `1:1`) exist in PHP (`CALCULATION_REGEXP_COLUMN_RANGE`, `CALCULATION_REGEXP_ROW_RANGE` in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`). TS range handling in `src/calculation/calculation.ts` expects A1-style addresses and `:` between two A1 addresses; it does not implement whole-column/whole-row range tokens.

### Cache behavior

PHP:

- Cache is keyed by worksheet+cell (`$wsTitle . '!' . $cellID`) and can be enabled/disabled (`getCalculationCacheEnabled`, `setCalculationCacheEnabled`) in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`.
- Cache is designed primarily for cell evaluation (`calculateCellValue` / `_calculateFormulaValue`) and is disabled for “free formulas” without cell context (`calculateFormula` disables cache temporarily).
- PHP also includes a cyclic reference stack with optional iteration behavior (cyclic counts) in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`.

TS:

- Cache is an instance map keyed by sheet title then cell ID (`#calculationCache: Map<string, Map<string, any>>`) in `src/calculation/calculation.ts`.
- Cache can be enabled/disabled (`setCacheEnabled`) and cleared (`clearCache`, `flushInstance`) in `src/calculation/calculation.ts`.
- There is no dependency invalidation: the cache does not automatically clear when precedent cells change; tests explicitly demonstrate this behavior (`tests/calculation/calculation-cache.test.ts`).

### Branch pruning (lazy IF)

PHP implements branch pruning in a dedicated engine component:

- `php-src/src/PhpSpreadsheet/Calculation/Engine/BranchPruner.php` tracks IF argument position using a depth model and parser callbacks (`functionCall`, `argumentSeparator`, `closingBrace`). This lets the evaluator avoid computing branches that cannot be reached.

TS implements a simpler runtime pruner:

- `src/calculation/engine/branch-pruner.ts` tracks a stack of IFs and an “onlyIf/onlyIfNot” pruning condition.
- `src/calculation/calculation.ts` drives it using token index and stack argument counting: on `IF` start it `pushIf`, on argument separators it inspects the just-computed condition and switches pruning to THEN/ELSE, and it `popIf` at function close.

This achieves the intended “don’t evaluate 1/0 in the pruned branch” behavior for the common cases covered by tests (see `tests/calculation/calculation.test.ts` “Branch Pruning (Lazy IF)”), but it is not a drop-in parity match with PHP’s depth-aware implementation.

### Structured references

PHP:

- Structured references are represented as an operand type and parsed/validated strictly: `php-src/src/PhpSpreadsheet/Calculation/Engine/Operands/StructuredReference.php`.

TS:

- Tokenization happens in `src/calculation/formula-parser.ts` and resolution is done by `src/calculation/engine/structured-reference.ts` from the active cell context.

Feature overlap observed in TS implementation/tests:

- Table name qualified refs (e.g. `Sales[@Price]`) and implicit “table containing current cell” lookup.
- Row references (`[@Column]` and `[[#This Row],[Column]]`) and column references (`[Column]`).
- Row specifiers: `#All`, `#Headers`, `#Data`, `#Totals`.

Primary test coverage: `tests/calculation/structured-reference.test.ts`.

Notable behavioral differences:

- PHP throws on invalid structured references (with calculation engine error codes); TS typically returns `'#REF!'` as a string sentinel from `src/calculation/engine/structured-reference.ts`.
- PHP normalizes non-breaking spaces in column names (`\u{a0}`) in `php-src/src/PhpSpreadsheet/Calculation/Engine/Operands/StructuredReference.php`; TS does not implement this normalization.

## Function coverage (what is actually implemented)

The authoritative list of implemented functions in TS is the registry population in `src/calculation/function-registry.ts` and the `registry.register(...)` calls inside `src/calculation/functions/*.ts`.

As of this repo state, TS registers 96 function names across 10 categories:

- Math/Trig: 5 (`src/calculation/functions/math-trig.ts`)
- Logical: 6 (`src/calculation/functions/logical.ts`)
- Statistical: 24 (`src/calculation/functions/statistical.ts`)
- Text: 4 (`src/calculation/functions/text-data.ts`)
- Lookup/Ref: 3 (`src/calculation/functions/lookup-ref.ts`)
- Date/Time: 14 (`src/calculation/functions/datetime.ts`)
- Financial: 7 (`src/calculation/functions/financial.ts`)
- Engineering: 13 (`src/calculation/functions/engineering.ts`)
- Conditional: 8 (`src/calculation/functions/conditional.ts`)
- Database: 12 (`src/calculation/functions/database.ts`)

In contrast, PhpSpreadsheet’s calculation surface area is far larger; function implementations are distributed over many directories and classes (e.g. `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/*`, `php-src/src/PhpSpreadsheet/Calculation/MathTrig/*`, `php-src/src/PhpSpreadsheet/Calculation/TextData/*`, `php-src/src/PhpSpreadsheet/Calculation/Statistical/*`, etc.) and centrally cataloged in `php-src/src/PhpSpreadsheet/Calculation/Functions.php`.

### Reconciling with `review/calculation-engine-status.md`

The repository status report at `review/calculation-engine-status.md` claims:

- “Status: 100% PARITY ACHIEVED”
- “TOTAL: 140+ functions”
- Presence of many functions (e.g. `CONCAT`, `TRIM`, `UPPER`, `LOWER`, `FIND`, `SEARCH`, `SUBSTITUTE`, `REPLACE`, `TEXT`, `HLOOKUP`, `INDIRECT`, `OFFSET`, `ROW`, `COLUMN`, `PRODUCT`, `POWER`, etc.)
- Union/intersection support and R1C1 support in the calculation engine

What the code/tests show instead:

- The TS function registry currently only exposes a subset of those named functions; for example, `src/calculation/functions/text-data.ts` only registers `LEN`, `LEFT`, `RIGHT`, and `CONCATENATE`.
- The lookup/reference category in TS currently registers `VLOOKUP`, `MATCH`, and `INDEX` only (`src/calculation/functions/lookup-ref.ts`).
- “Union/intersection” and “R1C1” exist as coordinate utilities (`src/utils/coordinate.ts`), but they are not integrated into formula evaluation in `src/calculation/calculation.ts`.

Conclusion: `review/calculation-engine-status.md` is not consistent with the current TypeScript implementation and should be treated as aspirational/outdated unless it is regenerated from `src/calculation/function-registry.ts`.

### What tests cover (and what they don’t)

TS calculation tests are present but are not a full parity harness against PHP:

- Core arithmetic/operator precedence, basic functions, IF/IFERROR/IFNA, branch pruning, cross-sheet refs, named ranges, VLOOKUP, INDEX+MATCH: `tests/calculation/calculation.test.ts`
- Cache enable/disable and lack of dependency invalidation: `tests/calculation/calculation-cache.test.ts`
- Array constants: `tests/calculation/array-constant.test.ts`
- Spill rewrite and ANCHORARRAY behavior: `tests/calculation/spill-operator.test.ts`
- Structured references: `tests/calculation/structured-reference.test.ts`
- A small DateTime subset: `tests/calculation-datetime.test.ts`

These tests validate that the engine works for the implemented subset, but they do not validate “full PhpSpreadsheet parity”.

## Major remaining gaps vs PhpSpreadsheet

This section lists notable parity gaps that appear from comparing `php-src/src/PhpSpreadsheet/Calculation/*` to the current `src/calculation/*` implementation.

### Function surface area

- PhpSpreadsheet supports hundreds of functions across many categories; TS currently implements 96 functions total.
- Several categories are absent in TS (examples from PHP tree): information functions, many text functions, many math/trig functions, many lookup/ref functions, web/service functions, locale translation features, and more.

### Formula language features

- Union/intersection and range operators as first-class operators (PHP: `∪`, `∩`, `:` precedence in `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`; TS: not implemented in evaluator `src/calculation/calculation.ts`).
- Column/row range tokens (`A:A`, `1:1`) and other reference syntaxes supported by PHP’s parser.
- Excel compatibility details (e.g. function name prefixes `_xlfn.` and `_xlws.`, localized function names via `CalculationLocale`, detailed error/wrapping semantics).

### Engine behaviors

- Cache invalidation based on dependency tracking is not implemented in TS; cache is purely “memoize by sheet+cell id until cleared”. PHP’s engine at least scopes and resets cache based on evaluation mode.
- Cyclic references: PHP has iteration controls; TS immediately returns `#CIRCULAR!` for re-entrancy (`src/calculation/calculation.ts`).

## Category/file mapping (where to look)

TS category files and their closest PHP counterparts:

- `src/calculation/calculation.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Calculation.php`
- `src/calculation/formula-parser.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/FormulaParser.php` (deprecated in PHP; TS currently uses this style)
- `src/calculation/engine/branch-pruner.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Engine/BranchPruner.php`
- `src/calculation/engine/structured-reference.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Engine/Operands/StructuredReference.php`

Function categories:

- `src/calculation/functions/datetime.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/DateTimeExcel/*`
- `src/calculation/functions/financial.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Financial/*`
- `src/calculation/functions/engineering.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Engineering/*`
- `src/calculation/functions/math-trig.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/MathTrig/*`
- `src/calculation/functions/statistical.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Statistical/*` (and some statistical helpers in other places)
- `src/calculation/functions/text-data.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/TextData/*`
- `src/calculation/functions/logical.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Logical/*` (PHP also embeds several logical behaviors in the core engine)
- `src/calculation/functions/lookup-ref.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/LookupRef/*`
- `src/calculation/functions/conditional.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Functions.php` entries + various category classes
- `src/calculation/functions/database.ts` ↔ `php-src/src/PhpSpreadsheet/Calculation/Database/*`

## Bottom line

- Architecture parity: TS mirrors the broad shape of PHP’s engine (tokenize → evaluate → function dispatch) but uses a simplified parser/evaluator model and a much smaller implemented function set.
- Feature parity (engine): spill rewrite and structured references exist and are tested; branch pruning and caching exist but are simplified compared to PHP.
- Function parity: TS currently provides a subset (96 functions). The repo status report in `review/calculation-engine-status.md` overstates function coverage and some formula-language features relative to what `src/calculation/*` implements today.
