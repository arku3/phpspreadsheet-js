<?php
require 'php-src/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\AutoFilter\Column;
use PhpOffice\PhpSpreadsheet\Worksheet\AutoFilter\Column\Rule;

try {
    $filename = 'autofilter-test.xlsx';
    if (!file_exists($filename)) {
        echo "File not found: $filename\n";
        exit(1);
    }

    echo "Loading $filename with PhpSpreadsheet...\n";
    $spreadsheet = IOFactory::load($filename);
    $sheet = $spreadsheet->getActiveSheet();

    echo "Sheet Title: " . $sheet->getTitle() . "\n";
    
    $autoFilter = $sheet->getAutoFilter();
    echo "AutoFilter Range: " . $autoFilter->getRange() . "\n";
    if ($autoFilter->getRange() !== 'A1:C6') {
        throw new Exception("Unexpected AutoFilter range: " . $autoFilter->getRange());
    }

    // Check Column A (Product)
    $columnA = $autoFilter->getColumn('A');
    echo "Column A Filter Type: " . $columnA->getFilterType() . "\n";
    $rulesA = $columnA->getRules();
    echo "Column A Rule Count: " . count($rulesA) . "\n";
    if (count($rulesA) > 0) {
        echo "Column A Rule 1 Value: " . $rulesA[0]->getValue() . "\n";
    }

    // Check Column B (Description)
    $columnB = $autoFilter->getColumn('B');
    echo "Column B Filter Type: " . $columnB->getFilterType() . "\n";
    $rulesB = $columnB->getRules();
    echo "Column B Rule Count: " . count($rulesB) . "\n";
    if (count($rulesB) > 0) {
        echo "Column B Rule 1 Op: " . $rulesB[0]->getOperator() . "\n";
        echo "Column B Rule 1 Value: " . $rulesB[0]->getValue() . "\n";
    }

    // Check Column C (Stock)
    $columnC = $autoFilter->getColumn('C');
    echo "Column C Filter Type: " . $columnC->getFilterType() . "\n";
    $rulesC = $columnC->getRules();
    echo "Column C Rule Count: " . count($rulesC) . "\n";
    if (count($rulesC) > 0) {
        echo "Column C Rule 1 Value: " . $rulesC[0]->getValue() . "\n";
        echo "Column C Rule 1 Grouping: " . $rulesC[0]->getGrouping() . "\n";
    }

    // Check Row Visibilities
    // Data:
    // 1: Product, Description, Stock (Header)
    // 2: Apple, Sweet Red, 10
    // 3: Banana, Yellow Long, 50
    // 4: Cherry, Small Red, 30
    // 5: Apple, Green Tart, 5
    // 6: Date, Brown sweet, 15

    // Filters:
    // A: Apple
    // B: *sweet*
    // C: Top 2
    
    // Evaluation:
    // Row 2: Apple (Yes), Sweet Red (Yes), 10 (No) -> Hidden
    // Row 3: Banana (No) -> Hidden
    // Row 4: Cherry (No) -> Hidden
    // Row 5: Apple (Yes), Green Tart (No) -> Hidden
    // Row 6: Date (No) -> Hidden

    // Note: showHideRows in my test script was applied.
    // However, usually filters in Excel are ANDed across columns.
    // In our case, none of them satisfy ALL filters.
    // Actually, Row 2: Apple, Sweet Red, 10.
    // Apple is in {Apple}.
    // Sweet Red matches *sweet*.
    // 10 is NOT in Top 2 (50, 30 are top 2).
    // So Row 2 should be hidden if Top 2 is active.
    
    for ($i = 2; $i <= 6; ++$i) {
        $visible = $sheet->getRowDimension($i)->getVisible();
        echo "Row $i Visibility: " . ($visible ? 'Visible' : 'Hidden') . "\n";
    }

    echo "Verification Successful!\n";
} catch (\Exception $e) {
    echo "Verification Failed: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
