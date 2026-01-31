<?php
declare(strict_types=1);

require 'php-src/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Verify an XLSX contains:
 * - defined names (via PhpSpreadsheet + workbook.xml <definedNames>)
 * - at least one table part, and a worksheet relationship referencing it
 */

function fail(string $message, int $code = 1): void
{
    fwrite(STDERR, $message . "\n");
    exit($code);
}

function println(string $message = ''): void
{
    echo $message . "\n";
}

$filename = $argv[1] ?? 'demo.xlsx';
if (!is_string($filename) || $filename === '') {
    fail('Usage: php verify-php/verify-definednames-tables.php path/to/file.xlsx');
}

if (!file_exists($filename)) {
    fail("File not found: {$filename}");
}

try {
    println("Loading {$filename} with PhpSpreadsheet...");

    /** @var Spreadsheet $spreadsheet */
    $spreadsheet = IOFactory::load($filename);

    // Defined names (PhpSpreadsheet API)
    $definedNames = $spreadsheet->getDefinedNames();
    println('Defined names (PhpSpreadsheet): ' . count($definedNames));
    foreach ($definedNames as $key => $definedName) {
        $scopeTitle = $definedName->getScope() ? $definedName->getScope()->getTitle() : '(global)';
        $type = $definedName->isFormula() ? 'formula' : 'range';
        println("- {$key}: name={$definedName->getName()} scope={$scopeTitle} type={$type} value={$definedName->getValue()}");
    }
    if (count($definedNames) === 0) {
        throw new Exception('Expected at least 1 defined name, found 0');
    }

    // Tables (PhpSpreadsheet API if available)
    $tableCount = 0;
    $sheetCount = $spreadsheet->getSheetCount();
    for ($i = 0; $i < $sheetCount; $i++) {
        /** @var Worksheet $sheet */
        $sheet = $spreadsheet->getSheet($i);

        if (!method_exists($sheet, 'getTableCollection')) {
            continue;
        }
        $tables = $sheet->getTableCollection();
        $count = $tables->count();
        if ($count === 0) {
            continue;
        }

        $tableCount += $count;
        println("Tables on sheet '{$sheet->getTitle()}': {$count}");
        foreach ($tables as $table) {
            // Table is PhpOffice\PhpSpreadsheet\Worksheet\Table
            println("- name={$table->getName()} range={$table->getRange()}");
        }
    }

    if ($tableCount === 0) {
        println('Tables via PhpSpreadsheet API: 0 (will verify via ZIP package contents instead)');
    } else {
        println('Tables via PhpSpreadsheet API (total): ' . $tableCount);
    }

    // ZIP-level verification (always run; this also covers table linkage)
    $zip = new ZipArchive();
    $openResult = $zip->open($filename);
    if ($openResult !== true) {
        throw new Exception("Failed to open XLSX as zip (ZipArchive::open result: {$openResult})");
    }

    $workbookXml = $zip->getFromName('xl/workbook.xml');
    if (!is_string($workbookXml) || $workbookXml === '') {
        throw new Exception('Missing or empty xl/workbook.xml');
    }
    if (strpos($workbookXml, '<definedNames') === false) {
        throw new Exception('xl/workbook.xml does not contain <definedNames>');
    }
    println('workbook.xml: <definedNames> present');

    $tableParts = [];
    $sheetXmlFiles = [];
    $sheetRelsFiles = [];

    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if (!is_string($name)) {
            continue;
        }

        if (preg_match('#^xl/tables/table\d+\.xml$#', $name) === 1) {
            $tableParts[] = $name;
        } elseif (preg_match('#^xl/worksheets/sheet\d+\.xml$#', $name) === 1) {
            $sheetXmlFiles[] = $name;
        } elseif (preg_match('#^xl/worksheets/_rels/sheet\d+\.xml\.rels$#', $name) === 1) {
            $sheetRelsFiles[] = $name;
        }
    }

    sort($tableParts);
    sort($sheetXmlFiles);
    sort($sheetRelsFiles);

    println('Table parts in package: ' . count($tableParts));
    foreach ($tableParts as $part) {
        println("- {$part}");
    }
    if (count($tableParts) === 0) {
        throw new Exception('Expected at least 1 table part under xl/tables/table*.xml, found 0');
    }

    // Confirm at least one sheet contains <tableParts>
    $sheetWithTableParts = null;
    foreach ($sheetXmlFiles as $sheetXmlPath) {
        $sheetXml = $zip->getFromName($sheetXmlPath);
        if (!is_string($sheetXml) || $sheetXml === '') {
            continue;
        }
        if (strpos($sheetXml, '<tableParts') !== false && strpos($sheetXml, '<tablePart') !== false) {
            $sheetWithTableParts = $sheetXmlPath;
            break;
        }
    }
    if ($sheetWithTableParts === null) {
        throw new Exception('No worksheet XML contains <tableParts>/<tablePart>');
    }
    println("Worksheet references tableParts: {$sheetWithTableParts}");

    // Confirm at least one sheet rel targets a table part that exists
    $tableTargets = [];
    foreach ($sheetRelsFiles as $relsPath) {
        $relsXml = $zip->getFromName($relsPath);
        if (!is_string($relsXml) || $relsXml === '') {
            continue;
        }

        // Relationship example:
        // <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>
        if (preg_match_all('#Type="[^"]*/relationships/table"\s+Target="([^"]+)"#', $relsXml, $m) > 0) {
            foreach ($m[1] as $target) {
                $target = (string) $target;
                // Targets are relative to xl/worksheets/, so normalize.
                // ../tables/table1.xml => xl/tables/table1.xml
                $normalized = preg_replace('#^\.\./#', 'xl/', $target);
                if (is_string($normalized) && $normalized !== '') {
                    $tableTargets[] = $normalized;
                }
            }
        }
    }

    $tableTargets = array_values(array_unique($tableTargets));
    sort($tableTargets);

    if (count($tableTargets) === 0) {
        throw new Exception('No worksheet .rels contains a table relationship');
    }
    println('Worksheet table relationship targets: ' . count($tableTargets));
    foreach ($tableTargets as $target) {
        $exists = $zip->locateName($target) !== false;
        println('- ' . $target . ' ' . ($exists ? '(exists)' : '(MISSING)'));
        if (!$exists) {
            throw new Exception("Worksheet relationship targets missing table part: {$target}");
        }
    }

    $zip->close();

    println('Verification Successful!');
} catch (Throwable $e) {
    fail('Verification Failed: ' . $e->getMessage());
}
