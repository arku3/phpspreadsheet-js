import fs from 'node:fs/promises';
import path from 'node:path';

type ParityRow = {
    phpRel: string;
    phpAbs: string;
    tsCandidates: string[];
    matchedTs: string[];
    phpSymbol: string;
    tsSymbols: string[];
};

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..');
const PHP_ROOT = path.join(REPO_ROOT, 'php-src', 'src', 'PhpSpreadsheet');
const TS_ROOT = path.join(REPO_ROOT, 'src');
const OUT_DIR = path.join(REPO_ROOT, 'review', 'php-ts-parity');

type ScopeDecision = { inScope: true } | { inScope: false; reason: string };

function scopeDecisionForPhpFile(phpRel: string): ScopeDecision {
    // Project scope: XLSX only. We ignore non-XLSX *format implementations* under Reader/ and Writer/.
    // We keep shared Reader/Writer infrastructure (interfaces, base classes, zip helpers, etc) in-scope.
    const parts = phpRel.replace(/\.php$/, '').split('/');
    const top = parts[0] ?? '';
    const second = parts[1] ?? '';

    // Under Reader/ or Writer/, treat the 3rd segment as "this is a subtree".
    // Example: Reader/Xls/Color.php => subtree; Reader/Csv.php => root file.
    const isInSubdir = parts.length >= 3;

    if (top === 'Reader') {
        // Keep Reader/Security in-scope since XML scanning/sanitization can be relevant to XLSX.
        const allowedSubdirs = new Set(['Xlsx', 'Security']);
        const excludedRootFiles = new Set(['Csv', 'Gnumeric', 'Html', 'Ods', 'Slk', 'Xls', 'XlsBase', 'Xml']);
        const sharedRootFiles = new Set(['BaseReader', 'DefaultReadFilter', 'Exception', 'IReadFilter', 'IReader']);

        if (isInSubdir) {
            if (allowedSubdirs.has(second)) return { inScope: true };
            return { inScope: false, reason: `Reader/${second} (non-Xlsx subtree)` };
        }

        // Root file under Reader/ (e.g. Reader/Csv.php, Reader/Xlsx.php).
        if (second === 'Xlsx') return { inScope: true };
        if (sharedRootFiles.has(second)) return { inScope: true };
        if (excludedRootFiles.has(second)) return { inScope: false, reason: `Reader/${second}.php (non-Xlsx format)` };
        return { inScope: true };
    }

    if (top === 'Writer') {
        const allowedSubdirs = new Set(['Xlsx']);
        const excludedRootFiles = new Set(['Csv', 'Html', 'Ods', 'Pdf', 'Xls']);
        const sharedRootFiles = new Set(['BaseWriter', 'Exception', 'IWriter']);

        if (isInSubdir) {
            if (allowedSubdirs.has(second)) return { inScope: true };
            return { inScope: false, reason: `Writer/${second} (non-Xlsx subtree)` };
        }

        // Root file under Writer/ (e.g. Writer/Csv.php, Writer/Xlsx.php, Writer/ZipStream2.php).
        if (second === 'Xlsx') return { inScope: true };
        if (sharedRootFiles.has(second)) return { inScope: true };
        if (/^ZipStream\d+$/.test(second)) return { inScope: true };
        if (excludedRootFiles.has(second)) return { inScope: false, reason: `Writer/${second}.php (non-Xlsx format)` };
        return { inScope: true };
    }

    return { inScope: true };
}

function toPosix(p: string): string {
    return p.split(path.sep).join('/');
}

async function walkFiles(rootAbs: string, suffix: string): Promise<string[]> {
    const out: string[] = [];
    const stack: string[] = [rootAbs];

    while (stack.length > 0) {
        const dir = stack.pop();
        if (!dir) continue;

        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
            const abs = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                stack.push(abs);
                continue;
            }
            if (ent.isFile() && ent.name.endsWith(suffix)) {
                out.push(abs);
            }
        }
    }

    out.sort((a, b) => a.localeCompare(b));
    return out;
}

function pascalToKebab(input: string): string {
    // Handles simple PascalCase and acronyms reasonably (e.g. XMLWriter -> xml-writer).
    return input
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
        .toLowerCase();
}

function extractPhpSymbol(source: string): string {
    const lines = source.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            continue;
        }
        const m = trimmed.match(/^(?:abstract\s+)?(class|interface|trait)\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
        if (m) return `${m[1]} ${m[2]}`;
    }
    return '';
}

function extractTsSymbols(source: string): string[] {
    const out: string[] = [];
    const lines = source.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            continue;
        }

        let m = trimmed.match(/^export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
        if (m) {
            out.push(`class ${m[1]}`);
            continue;
        }
        m = trimmed.match(/^export\s+interface\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
        if (m) {
            out.push(`interface ${m[1]}`);
            continue;
        }
        m = trimmed.match(/^export\s+type\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
        if (m) {
            out.push(`type ${m[1]}`);
            continue;
        }
        m = trimmed.match(/^export\s+function\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
        if (m) {
            out.push(`fn ${m[1]}`);
            continue;
        }
        m = trimmed.match(/^export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
        if (m) {
            out.push(`const ${m[1]}`);
            continue;
        }
    }
    return Array.from(new Set(out));
}

function dirRemap(phpTop: string): string[] {
    switch (phpTop) {
        case 'Calculation':
            return ['calculation'];
        case 'Style':
            return ['style'];
        case 'Worksheet':
            return ['worksheet', 'core'];
        case 'Document':
            return ['document'];
        case 'RichText':
            return ['rich-text'];
        case 'Writer':
            return ['io'];
        case 'Reader':
            return ['io'];
        case 'Shared':
            return ['shared', 'utils', 'common'];
        case 'Cell':
            return ['core', 'utils'];
        case 'Collection':
            return ['common', 'core'];
        default:
            return ['core', 'utils', 'shared', 'common', 'worksheet', 'style', 'io'];
    }
}

const SPECIAL_CASES: Record<string, string[]> = {
    // Root classes.
    Spreadsheet: ['core/spreadsheet.ts'],
    Theme: ['style/theme.ts'],
    Settings: ['core/settings.ts', 'core/spreadsheet-settings.ts'],
    DefinedName: ['core/defined-name.ts'],
    NamedRange: ['core/named-range.ts'],
    NamedFormula: ['core/named-formula.ts'],
    Comment: ['core/comment.ts'],
    HashTable: ['common/hash-table.ts'],
    Exception: ['core/errors.ts'],

    // IO entrypoints.
    'Reader/Xlsx': ['io/xlsx-reader.ts'],
    'Writer/Xlsx': ['io/xlsx-writer.ts'],
    IOFactory: ['io/io-factory.ts'],

    // Cell utilities.
    'Cell/Coordinate': ['utils/coordinate.ts'],
    'Cell/Hyperlink': ['core/hyperlink.ts'],
    'Cell/DataValidation': ['core/data-validation.ts'],
    'Cell/DataType': ['core/data-type.ts'],
    'Cell/Cell': ['core/cell.ts'],
    'Collection/Cells': ['core/cell-collection.ts'],

    // Shared utilities.
    'Shared/StringHelper': ['utils/string-helper.ts'],
    'Shared/PasswordHasher': ['shared/password-hasher.ts'],

    // Worksheet main class is in core.
    'Worksheet/Worksheet': ['core/worksheet.ts'],
};

function guessTsCandidates(phpRel: string): string[] {
    const phpNoExt = phpRel.replace(/\.php$/, '');
    const special = SPECIAL_CASES[phpNoExt];
    if (special) return special.slice();

    const parts = phpNoExt.split('/');
    const top = parts[0] ?? '';
    const rest = parts.slice(1);
    const base = parts[parts.length - 1] ?? '';

    // PhpSpreadsheet splits many calculation functions into many files; TS groups by category.
    if (top === 'Calculation' && rest.length > 0) {
        const cat = rest[0];
        if (cat === 'Database') return ['calculation/functions/database.ts'];
        if (cat === 'DateTimeExcel') return ['calculation/functions/datetime.ts'];
        if (cat === 'Engineering') return ['calculation/functions/engineering.ts'];
        if (cat === 'Financial') return ['calculation/functions/financial.ts'];
        if (cat === 'Logical') return ['calculation/functions/logical.ts'];
        if (cat === 'LookupRef') return ['calculation/functions/lookup-ref.ts'];
        if (cat === 'MathTrig') return ['calculation/functions/math-trig.ts'];
        if (cat === 'Statistical') return ['calculation/functions/statistical.ts'];
        if (cat === 'TextData') return ['calculation/functions/text-data.ts'];
        if (cat === 'Engine') {
            const name = rest[rest.length - 1] ?? '';
            if (name === 'BranchPruner') return ['calculation/engine/branch-pruner.ts'];
            if (name === 'StructuredReference') return ['calculation/engine/structured-reference.ts'];
        }
    }

    // Interfaces: IWriter -> i-writer
    const tsBase =
        base.startsWith('I') && base.length > 1 && /[A-Z]/.test(base[1] ?? '')
            ? `i-${pascalToKebab(base.slice(1))}`
            : pascalToKebab(base);

    // Directory rest: PascalCase segments to kebab.
    const tsRest = rest.map(pascalToKebab);

    // Writer/Xlsx/Foo.php should map to io/xlsx/foo.ts if possible.
    if (top === 'Writer' && rest[0] === 'Xlsx') {
        const partPath = rest.slice(1).map(pascalToKebab).filter(Boolean).join('/');
        const preferred = `io/xlsx/${partPath || tsBase}.ts`;
        // Keep a fallback only if it is different (some names may flatten to tsBase).
        const fallback = `io/xlsx/${tsBase}.ts`;
        return Array.from(new Set([preferred, fallback]));
    }

    if (top === 'Reader' && rest[0] === 'Xlsx') {
        // Prefer per-part reader implementations (src/io/xlsx/*.ts).
        // The orchestrator is `src/io/xlsx-reader.ts` (handled as a special case for Reader/Xlsx.php).
        const partPath = rest.slice(1).map(pascalToKebab).filter(Boolean).join('/');
        return [`io/xlsx/${partPath || tsBase}.ts`];
    }

    const roots = dirRemap(top);
    const candidates: string[] = [];
    for (const r of roots) {
        const rel = [r, ...tsRest, `${tsBase}.ts`].filter(Boolean).join('/');
        candidates.push(rel);
    }

    // Also try flattening (many TS files are flatter than PHP namespaces).
    for (const r of roots) {
        candidates.push([r, `${tsBase}.ts`].filter(Boolean).join('/'));
    }

    // De-dup.
    return Array.from(new Set(candidates));
}

function groupKey(phpRel: string): string {
    const parts = phpRel.split('/');
    return (parts.length > 1 ? parts[0] : undefined) ?? '_root';
}

function fmtRowStatus(row: ParityRow): 'matched' | 'missing' | 'ambiguous' {
    if (row.matchedTs.length === 0) return 'missing';
    if (row.matchedTs.length === 1) return 'matched';
    return 'ambiguous';
}

async function writeMarkdown(fileAbs: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(fileAbs), { recursive: true });
    await fs.writeFile(fileAbs, content, 'utf8');
}

function mdEscapePipe(s: string): string {
    return s.replace(/\|/g, '\\|');
}

async function main(): Promise<void> {
    const phpAbsFiles = await walkFiles(PHP_ROOT, '.php');
    const tsAbsFiles = await walkFiles(TS_ROOT, '.ts');

    const phpScope = phpAbsFiles
        .map((phpAbs) => {
            const phpRel = toPosix(path.relative(PHP_ROOT, phpAbs));
            const scope = scopeDecisionForPhpFile(phpRel);
            return { phpAbs, phpRel, scope };
        })
        .sort((a, b) => a.phpRel.localeCompare(b.phpRel));

    const phpInScope = phpScope.filter((e) => e.scope.inScope);
    const phpOutOfScope = phpScope.filter((e) => !e.scope.inScope);

    const tsRelSet = new Set<string>(tsAbsFiles.map((abs) => toPosix(path.relative(REPO_ROOT, abs))));
    const matchedTsRel = new Set<string>();

    const rows: ParityRow[] = [];
    for (const { phpAbs, phpRel } of phpInScope) {
        const candidates = guessTsCandidates(phpRel);
        const matched = candidates.map((c) => toPosix(path.join('src', c))).filter((rel) => tsRelSet.has(rel));
        for (const rel of matched) matchedTsRel.add(rel);

        const phpSource = await fs.readFile(phpAbs, 'utf8');
        const phpSymbol = extractPhpSymbol(phpSource);

        const tsSymbols: string[] = [];
        for (const tsRel of matched) {
            const tsAbs = path.join(REPO_ROOT, tsRel);
            const tsSource = await fs.readFile(tsAbs, 'utf8');
            tsSymbols.push(...extractTsSymbols(tsSource));
        }

        rows.push({
            phpRel,
            phpAbs,
            tsCandidates: candidates,
            matchedTs: matched,
            phpSymbol,
            tsSymbols: Array.from(new Set(tsSymbols)).sort((a, b) => a.localeCompare(b)),
        });
    }

    const phpOnlyCount = rows.filter((r) => r.matchedTs.length === 0).length;
    const ambiguousCount = rows.filter((r) => r.matchedTs.length > 1).length;

    const tsOnly = Array.from(tsRelSet)
        .filter((rel) => !matchedTsRel.has(rel))
        .sort((a, b) => a.localeCompare(b));

    const tsToPhp = new Map<string, string[]>();
    for (const row of rows) {
        for (const tsRel of row.matchedTs) {
            const arr = tsToPhp.get(tsRel) ?? [];
            arr.push(row.phpRel);
            tsToPhp.set(tsRel, arr);
        }
    }
    for (const [, arr] of tsToPhp) {
        arr.sort((a, b) => a.localeCompare(b));
    }

    const byGroup = new Map<string, ParityRow[]>();
    for (const row of rows) {
        const key = groupKey(row.phpRel);
        const arr = byGroup.get(key) ?? [];
        arr.push(row);
        byGroup.set(key, arr);
    }
    for (const [, arr] of byGroup) {
        arr.sort((a, b) => a.phpRel.localeCompare(b.phpRel));
    }

    // Index.
    const now = new Date().toISOString();
    const indexLines: string[] = [];
    indexLines.push('# PHP vs TS Parity Report (File Map)');
    indexLines.push('');
    indexLines.push(`Generated: ${now}`);
    indexLines.push('');
    indexLines.push('## Scope');
    indexLines.push('');
    indexLines.push(
        'This report is **XLSX-focused**. It excludes non-XLSX PHP readers/writers (e.g. CSV/ODS/XLS/Html/Pdf) from counts and lists.',
    );
    indexLines.push('');
    indexLines.push(
        'This is a file-by-file *mapping* report. It pairs PHP PhpSpreadsheet files under `php-src/src/PhpSpreadsheet/` with likely TypeScript counterparts under `src/` based on path/name heuristics and a small special-case table.',
    );
    indexLines.push('');
    indexLines.push(
        'It does not prove behavioral parity; it is meant to be the starting point for deeper audits and to surface missing/ambiguous mappings.',
    );
    indexLines.push('');
    indexLines.push('## Totals');
    indexLines.push('');
    indexLines.push(`- PHP files (in-scope): ${phpInScope.length}`);
    indexLines.push(`- PHP files (out-of-scope, ignored): ${phpOutOfScope.length}`);
    indexLines.push(`- TS files: ${tsAbsFiles.length}`);
    indexLines.push(`- PHP files with no TS match (by heuristic): ${phpOnlyCount}`);
    indexLines.push(`- PHP files with multiple TS matches (ambiguous): ${ambiguousCount}`);
    indexLines.push(`- TS files with no PHP match (by heuristic): ${tsOnly.length}`);
    indexLines.push('');
    indexLines.push('## Modules');
    indexLines.push('');
    const groupKeys = Array.from(byGroup.keys()).sort((a, b) => a.localeCompare(b));
    for (const g of groupKeys) {
        const filename = `${g.toLowerCase()}-map.md`;
        const groupRows = byGroup.get(g) ?? [];
        const matched = groupRows.filter((r) => r.matchedTs.length === 1).length;
        const missing = groupRows.filter((r) => r.matchedTs.length === 0).length;
        const ambiguous = groupRows.filter((r) => r.matchedTs.length > 1).length;
        indexLines.push(
            `- ${g}: ./modules/${filename} (matched: ${matched}, missing: ${missing}, ambiguous: ${ambiguous})`,
        );
    }
    indexLines.push('');
    indexLines.push('## Lists');
    indexLines.push('');
    indexLines.push('- PHP-only: ./lists/php-only.md');
    indexLines.push('- PHP out-of-scope (ignored): ./lists/php-out-of-scope.md');
    indexLines.push('- TS-only: ./lists/ts-only.md');
    indexLines.push('- Ambiguous: ./lists/ambiguous.md');
    indexLines.push('- TS -> PHP coverage: ./lists/ts-to-php.md');

    await writeMarkdown(path.join(OUT_DIR, 'README.md'), indexLines.join('\n') + '\n');

    const tsOnlyRendered =
        [
            '# TS-only Files (Heuristic)',
            '',
            'These TS files were not matched to any PHP file by the current heuristic mapping. Some are expected (glue/architecture differences), others may indicate missing PHP coverage in the mapping table.',
            '',
            ...tsOnly.map((rel) => `- \`${rel}\``),
        ].join('\n') + '\n';
    await writeMarkdown(path.join(OUT_DIR, 'lists', 'ts-only.md'), tsOnlyRendered);

    const phpOnly = rows
        .filter((r) => r.matchedTs.length === 0)
        .map((r) => `- \`php-src/src/PhpSpreadsheet/${r.phpRel}\``)
        .sort((a, b) => a.localeCompare(b));
    const phpOnlyRendered =
        [
            '# PHP-only Files (Heuristic)',
            '',
            'These PHP files were not matched to any TS file by the current heuristic mapping. Many will be legitimate gaps; some are false negatives due to naming/structure differences.',
            '',
            ...phpOnly,
        ].join('\n') + '\n';
    await writeMarkdown(path.join(OUT_DIR, 'lists', 'php-only.md'), phpOnlyRendered);

    const phpOutOfScopeRendered =
        [
            '# PHP out-of-scope Files (Ignored)',
            '',
            'These PHP files are intentionally excluded from this parity report because the project scope is XLSX-only.',
            'The current filter excludes non-XLSX subtrees under `Reader/` and `Writer/`.',
            '',
            ...phpOutOfScope.map((e) => {
                const reason = (e.scope as { inScope: false; reason: string }).reason;
                return `- \`php-src/src/PhpSpreadsheet/${e.phpRel}\` (${mdEscapePipe(reason)})`;
            }),
        ].join('\n') + '\n';
    await writeMarkdown(path.join(OUT_DIR, 'lists', 'php-out-of-scope.md'), phpOutOfScopeRendered);

    const ambiguous = rows
        .filter((r) => r.matchedTs.length > 1)
        .sort((a, b) => a.phpRel.localeCompare(b.phpRel))
        .map((r) => {
            const matches = r.matchedTs.map((m) => `\`${m}\``).join(', ');
            const candidates = r.tsCandidates
                .slice(0, 8)
                .map((c) => `\`src/${c}\``)
                .join(', ');
            return `- \`php-src/src/PhpSpreadsheet/${r.phpRel}\` -> matches: ${matches} (candidates: ${candidates})`;
        });
    const ambiguousRendered =
        [
            '# Ambiguous Mappings (Heuristic)',
            '',
            'These PHP files matched multiple TS files. This often indicates TS code is split across multiple files, or the heuristic is too broad and needs special-casing.',
            '',
            ...ambiguous,
        ].join('\n') + '\n';
    await writeMarkdown(path.join(OUT_DIR, 'lists', 'ambiguous.md'), ambiguousRendered);

    const tsToPhpRendered = [
        '# TS -> PHP Coverage (Heuristic)',
        '',
        'For each TypeScript file, list PHP files that mapped to it under the heuristic. This is especially useful where TS consolidates many PHP classes/functions into one file (notably Calculation).',
        '',
        ...Array.from(tsToPhp.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([tsRel, phpRels]) => {
                const lines: string[] = [];
                lines.push(`## \`${tsRel}\``);
                lines.push('');
                for (const phpRel of phpRels) {
                    lines.push(`- \`php-src/src/PhpSpreadsheet/${phpRel}\``);
                }
                lines.push('');
                return lines.join('\n');
            }),
    ].join('\n');
    await writeMarkdown(path.join(OUT_DIR, 'lists', 'ts-to-php.md'), tsToPhpRendered);

    // Per-group module maps.
    for (const g of groupKeys) {
        const moduleLines: string[] = [];
        moduleLines.push(`# PHP vs TS Parity Map: ${g}`);
        moduleLines.push('');
        moduleLines.push(
            '| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |',
        );
        moduleLines.push('|---|---|---|---|---|---|');

        const groupRows = byGroup.get(g) ?? [];
        for (const row of groupRows) {
            const phpFile = mdEscapePipe(`php-src/src/PhpSpreadsheet/${row.phpRel}`);
            const status = fmtRowStatus(row);
            const match = row.matchedTs.length > 0 ? row.matchedTs.map((m) => `\`${m}\``).join('<br>') : '';
            const phpSymbol = row.phpSymbol ? `\`${mdEscapePipe(row.phpSymbol)}\`` : '';
            const tsSymbols =
                row.tsSymbols.length > 0 ? row.tsSymbols.map((s) => `\`${mdEscapePipe(s)}\``).join('<br>') : '';
            const candidates = row.tsCandidates
                .slice(0, 5)
                .map((c) => `src/${c}`)
                .map(mdEscapePipe)
                .join('<br>');
            moduleLines.push(`| \`${phpFile}\` | ${phpSymbol} | ${match} | ${tsSymbols} | ${status} | ${candidates} |`);
        }

        const outPath = path.join(OUT_DIR, 'modules', `${g.toLowerCase()}-map.md`);
        await writeMarkdown(outPath, moduleLines.join('\n') + '\n');
    }
}

await main();
