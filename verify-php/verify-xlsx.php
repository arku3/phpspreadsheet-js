<?php
require 'php-src/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

try {
    $filename = 'demo.xlsx';
    if (!file_exists($filename)) {
        echo "File not found: $filename\n";
        exit(1);
    }

    echo "Loading $filename with PhpSpreadsheet...\n";
    $spreadsheet = IOFactory::load($filename);
    $sheet = $spreadsheet->getActiveSheet();

    echo "Sheet Title: " . $sheet->getTitle() . "\n";
    
    // Check A1
    echo "A1 Value: " . $sheet->getCell('A1')->getValue() . "\n";
    $styleA1 = $sheet->getStyle('A1');
    echo "A1 Bold: " . ($styleA1->getFont()->getBold() ? 'Yes' : 'No') . "\n";
    echo "A1 Font Color: " . $styleA1->getFont()->getColor()->getRGB() . "\n";
    echo "A1 Fill Type: " . $styleA1->getFill()->getFillType() . "\n";
    echo "A1 Fill Start Color: " . $styleA1->getFill()->getStartColor()->getRGB() . "\n";

    // Check Dimensions
    echo "Column A Width: " . $sheet->getColumnDimension('A')->getWidth() . "\n";
    echo "Row 1 Height: " . $sheet->getRowDimension(1)->getRowHeight() . "\n";

    // Check B2 (Formula)
    echo "B2 Formula: " . $sheet->getCell('B2')->getValue() . "\n";

    // Check Sheet 2
    $sheet2 = $spreadsheet->getSheet(1);
    echo "Sheet 2 Title: " . $sheet2->getTitle() . "\n";
    echo "Sheet 2 A1: " . $sheet2->getCell('A1')->getValue() . "\n";

    echo "Verification Successful!\n";
} catch (\Exception $e) {
    echo "Verification Failed: " . $e->getMessage() . "\n";
    exit(1);
}
