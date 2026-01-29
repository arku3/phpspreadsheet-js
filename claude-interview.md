# Interview Transcript: phpspreadsheet-js

## 1. API Design
**Question**: Should the public API strictly follow PhpSpreadsheet's naming or use idiomatic TypeScript?
**Answer**: Strict Parity (PHP style). The goal is to make it familiar for users migrating from or familiar with PhpSpreadsheet (e.g., `getActiveSheet`, `setCellValue`).

## 2. Internal Storage
**Question**: What is the preferred internal storage strategy for cell data?
**Answer**: Map-based (Standard). Use `Map<string, Cell>` for the sparse grid to maintain simplicity and flexibility in the first phase.

## 3. Bun Integration
**Question**: Which Bun-specific features should be prioritized?
**Answer**: Bun File API (Streaming) and Bun Native Integration. Focus on leveraging Bun's high-performance APIs for file handling and native speed.

## 4. Feature Priorities
**Question**: Are there specific spreadsheet features that should be prioritized in the first phase?
**Answer**: All features are of equal importance and must be ported (Advanced Lookup, Dynamic Arrays, Structured References, etc.).
