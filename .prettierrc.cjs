/** @type {import('prettier').Config} */
module.exports = {
    printWidth: 100,
    tabWidth: 4,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    arrowParens: 'always',

    plugins: ['@ianvs/prettier-plugin-sort-imports'],
    // Match current src/ style: no blank-line import grouping.
    importOrder: ['<BUILTIN_MODULES>', '<THIRD_PARTY_MODULES>', '^\\.\\./', '^\\./'],
    importOrderParserPlugins: ['typescript'],
    // Keep type/value imports separate (current code frequently uses `import type`).
    importOrderTypeScriptVersion: '5.0.0',

    overrides: [
        {
            files: ['*.json', '*.yml', '*.yaml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
